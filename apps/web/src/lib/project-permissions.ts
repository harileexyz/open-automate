import type { User } from 'firebase/auth';
import type { Project } from '@/lib/hooks/useProjects';

export function isProjectOwner(project: Pick<Project, 'ownerId'> | null | undefined, user: Pick<User, 'uid'> | null | undefined) {
    return !!project && !!user && project.ownerId === user.uid;
}

export function canViewProject(project: Pick<Project, 'ownerId' | 'members'> | null | undefined, user: Pick<User, 'uid'> | null | undefined) {
    if (!project || !user) return false;
    return project.ownerId === user.uid || project.members.includes(user.uid);
}

export function canEditProject(project: Pick<Project, 'ownerId'> | null | undefined, user: Pick<User, 'uid'> | null | undefined) {
    return isProjectOwner(project, user);
}
