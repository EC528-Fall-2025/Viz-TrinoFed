
import AppRoutes from './routing/AppRoutes';
import {Stack, Box, AppBar, Toolbar} from '@mui/material';
import NavButton from './NavButton';
import {Link as RouterLink, useLocation } from 'react-router-dom';
import { QueryResultsProvider } from './contexts/QueryResultsContext';

export default function App() {
  const { pathname } = useLocation();

  const links = [
    { to: '/help', label: 'Help', testId: 'docs-link' },
    { to: '/query-history', label: 'Query History', testId: 'history-link' },
    { to: '/', label: 'Current Query', testId: 'current-link' },
    { to: '/overall-stats', label: 'Overall Stats', testId: 'overall-stats-link' },
  ];

  return (
    <QueryResultsProvider>
      <Box sx={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', overflow: 'hidden' }}>
        <AppBar sx={{backgroundColor: 'white', color: 'black', zIndex: (theme) => theme.zIndex.drawer + 1}} position="static" elevation={1}>
          <Toolbar component="nav" sx={{justifyContent: 'flex-end', gap: 2}}>
            <Stack direction="row" spacing={2}>
              {links.map((link) => (
                <NavButton
                  key={link.to}
                  to={link.to}
                  dataTestId={link.testId}
                  sx={{
                    fontWeight: pathname === link.to || (pathname === '/' && link.to === '/') ? 'bold' : 'normal',
                    textDecoration: pathname === link.to ? 'underline' : 'none'
                  }}
                >
                  {link.label}
                </NavButton>
              ))}
            </Stack>
          </Toolbar>
        </AppBar>
        <Box sx={{flex: 1, minHeight: 0, overflow: 'hidden'}}>
          <AppRoutes />
        </Box>
      </Box>
    </QueryResultsProvider>
  );
}