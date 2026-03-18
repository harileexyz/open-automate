'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Timestamp, orderBy } from 'firebase/firestore';

export interface ProjectVariable {
    id: string;
    projectId: string;
    key: string;
    value: string;
    isSecret: boolean;
    description?: string;
    createdAt?: any;
    updatedAt?: any;
}

export function useProjectVariables(projectId: string) {
    const [variables, setVariables] = useState<ProjectVariable[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!projectId) return;

        const q = query(
            collection(db, 'variables'),
            where('projectId', '==', projectId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const vars = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as ProjectVariable)).sort((a, b) => a.key.localeCompare(b.key));
            setVariables(vars);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching variables:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [projectId]);

    return { variables, loading };
}

export function useProjectVariableMutations() {
    const [loading, setLoading] = useState(false);

    const createVariable = async (data: Omit<ProjectVariable, 'id' | 'createdAt' | 'updatedAt'>) => {
        setLoading(true);
        try {
            await addDoc(collection(db, 'variables'), {
                ...data,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            });
        } finally {
            setLoading(false);
        }
    };

    const updateVariable = async (id: string, data: Partial<ProjectVariable>) => {
        setLoading(true);
        try {
            await updateDoc(doc(db, 'variables', id), {
                ...data,
                updatedAt: Timestamp.now()
            });
        } finally {
            setLoading(false);
        }
    };

    const deleteVariable = async (id: string) => {
        setLoading(true);
        try {
            await deleteDoc(doc(db, 'variables', id));
        } finally {
            setLoading(false);
        }
    };

    return { createVariable, updateVariable, deleteVariable, loading };
}
