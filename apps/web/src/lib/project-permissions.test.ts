import { describe, expect, it } from 'vitest';
import { canEditProject, canViewProject, isProjectOwner } from './project-permissions';

describe('project permissions', () => {
    const project = { ownerId: 'owner-1', members: ['viewer-1'] };

    it('identifies the owner correctly', () => {
        expect(isProjectOwner(project as any, { uid: 'owner-1' } as any)).toBe(true);
        expect(isProjectOwner(project as any, { uid: 'viewer-1' } as any)).toBe(false);
    });

    it('allows viewers to read but not edit', () => {
        expect(canViewProject(project as any, { uid: 'viewer-1' } as any)).toBe(true);
        expect(canEditProject(project as any, { uid: 'viewer-1' } as any)).toBe(false);
    });

    it('blocks non-members from viewing', () => {
        expect(canViewProject(project as any, { uid: 'stranger-1' } as any)).toBe(false);
    });
});
