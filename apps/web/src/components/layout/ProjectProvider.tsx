'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTestCases, useTestSuites, TestCase, TestSuite } from '@/lib/hooks';

interface ProjectContextType {
    testCases: TestCase[];
    suites: TestSuite[];
    loadingCases: boolean;
    loadingSuites: boolean;
}

const ProjectContext = createContext<ProjectContextType>({
    testCases: [],
    suites: [],
    loadingCases: false,
    loadingSuites: false,
});

export function ProjectProvider({ children }: { children: React.ReactNode }) {
    const params = useParams();
    const projectId = params.projectId as string | undefined;

    const { testCases, loading: loadingCases } = useTestCases(projectId || null);
    const { suites, loading: loadingSuites } = useTestSuites(projectId || null);

    return (
        <ProjectContext.Provider value={{ testCases, suites, loadingCases, loadingSuites }}>
            {children}
        </ProjectContext.Provider>
    );
}

export function useProjectContext() {
    return useContext(ProjectContext);
}
