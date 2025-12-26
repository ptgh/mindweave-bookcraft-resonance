import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { getPageContext, PageContext } from '@/constants/assistantContexts';

export function usePageContext(): PageContext {
  const { pathname } = useLocation();
  
  const context = useMemo(() => {
    return getPageContext(pathname);
  }, [pathname]);
  
  return context;
}
