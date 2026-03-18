'use client';

/**
 * Firestore Hooks for Projects
 * Provides CRUD operations and real-time subscriptions
 */

import { useState, useEffect, useCallback } from 'react';
import {
    collection,
    doc,
    query,
    where,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { db, useAuth } from '@/lib/firebase';
import { COLLECTIONS, DEFAULT_PROJECT_SETTINGS } from '@/lib/constants';

// Types
export interface Project {
    id: string;
    name: string;
    description?: string;
    baseUrl: string;
    ownerId: string;
    members: string[];
    idPrefix: string;
    lastTestNumber: number;
    settings: {
        defaultBrowser: 'chromium' | 'firefox' | 'webkit';
        defaultViewport: { width: number; height: number };
        screenshotOnFailure: boolean;
        videoRecording: boolean;
    };
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// Helper to generate prefix from name
function generatePrefix(name: string): string {
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
        return words.map(word => word[0]).join('').toUpperCase().substring(0, 4);
    }
    return name.substring(0, 3).toUpperCase();
}

export interface CreateProjectInput {
    name: string;
    description?: string;
    baseUrl: string;
}

export interface UpdateProjectInput {
    name?: string;
    description?: string;
    baseUrl?: string;
    settings?: Partial<Project['settings']>;
    members?: string[];
}

/**
 * Hook to fetch all projects for the current user
 */
export function useProjects() {
    const { user } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!user) {
            setProjects([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        const projectMap = new Map<string, Project>();

        const commitProjects = () => {
            const projectList = Array.from(projectMap.values());
            projectList.sort((a, b) => {
                const aTime = a.createdAt?.toMillis() || 0;
                const bTime = b.createdAt?.toMillis() || 0;
                return bTime - aTime;
            });
            setProjects(projectList);
            setLoading(false);
            setError(null);
        };

        const unsubscribers = [
            onSnapshot(
                query(collection(db, COLLECTIONS.PROJECTS), where('ownerId', '==', user.uid)),
                (snapshot) => {
                    snapshot.forEach((projectDoc) => {
                        projectMap.set(projectDoc.id, { id: projectDoc.id, ...projectDoc.data() } as Project);
                    });
                    commitProjects();
                },
                (err) => {
                    console.error('Error fetching owned projects:', err);
                    setError(err);
                    setLoading(false);
                }
            ),
            onSnapshot(
                query(collection(db, COLLECTIONS.PROJECTS), where('members', 'array-contains', user.uid)),
                (snapshot) => {
                    snapshot.forEach((projectDoc) => {
                        projectMap.set(projectDoc.id, { id: projectDoc.id, ...projectDoc.data() } as Project);
                    });
                    commitProjects();
                },
                (err) => {
                    console.error('Error fetching shared projects:', err);
                    setError(err);
                    setLoading(false);
                }
            ),
        ];

        return () => {
            unsubscribers.forEach((unsubscribe) => unsubscribe());
        };
    }, [user]);

    return { projects, loading, error };
}

/**
 * Hook to fetch a single project by ID
 */
export function useProject(projectId: string | null) {
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!projectId) {
            setProject(null);
            setLoading(false);
            return;
        }

        setLoading(true);

        const unsubscribe = onSnapshot(
            doc(db, COLLECTIONS.PROJECTS, projectId),
            (docSnap) => {
                if (docSnap.exists()) {
                    setProject({ id: docSnap.id, ...docSnap.data() } as Project);
                } else {
                    setProject(null);
                }
                setLoading(false);
                setError(null);
            },
            (err) => {
                console.error('Error fetching project:', err);
                setError(err);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [projectId]);

    return { project, loading, error };
}

/**
 * Hook for project mutations (create, update, delete)
 */
export function useProjectMutations() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const createProject = useCallback(
        async (input: CreateProjectInput): Promise<string> => {
            if (!user) throw new Error('Not authenticated');

            setLoading(true);
            setError(null);

            try {
                const prefix = generatePrefix(input.name);
                const docRef = await addDoc(collection(db, COLLECTIONS.PROJECTS), {
                    name: input.name,
                    description: input.description || '',
                    baseUrl: input.baseUrl,
                    ownerId: user.uid,
                    members: [],
                    idPrefix: prefix,
                    lastTestNumber: 0,
                    settings: DEFAULT_PROJECT_SETTINGS,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });

                setLoading(false);
                return docRef.id;
            } catch (err) {
                const error = err as Error;
                setError(error);
                setLoading(false);
                throw error;
            }
        },
        [user]
    );

    const updateProject = useCallback(
        async (projectId: string, input: UpdateProjectInput): Promise<void> => {
            if (!user) throw new Error('Not authenticated');

            setLoading(true);
            setError(null);

            try {
                const updateData: Record<string, unknown> = {
                    updatedAt: serverTimestamp(),
                };

                if (input.name !== undefined) updateData.name = input.name;
                if (input.description !== undefined) updateData.description = input.description;
                if (input.baseUrl !== undefined) updateData.baseUrl = input.baseUrl;
                if (input.settings !== undefined) {
                    // Merge settings
                    updateData['settings'] = input.settings;
                }
                if (input.members !== undefined) updateData.members = input.members;

                await updateDoc(doc(db, COLLECTIONS.PROJECTS, projectId), updateData);
                setLoading(false);
            } catch (err) {
                const error = err as Error;
                setError(error);
                setLoading(false);
                throw error;
            }
        },
        [user]
    );

    const updateProjectMembers = useCallback(
        async (projectId: string, members: string[]): Promise<void> => {
            await updateProject(projectId, { members });
        },
        [updateProject]
    );

    const deleteProject = useCallback(
        async (projectId: string): Promise<void> => {
            if (!user) throw new Error('Not authenticated');

            setLoading(true);
            setError(null);

            try {
                await deleteDoc(doc(db, COLLECTIONS.PROJECTS, projectId));
                setLoading(false);
            } catch (err) {
                const error = err as Error;
                setError(error);
                setLoading(false);
                throw error;
            }
        },
        [user]
    );

    return {
        createProject,
        updateProject,
        updateProjectMembers,
        deleteProject,
        loading,
        error,
    };
}
