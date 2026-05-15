import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useCurrentUser } from './currentUserContext.js';
import { formatUserRole } from './formatUserRole.js';

/** Read-only acting-user line in the filter toolbar (select is in the app bar). */
export function ToolbarCurrentUserDisplay() {
  const { currentUser } = useCurrentUser();

  return (
    <Box sx={{ minWidth: { xs: '100%', md: 240 } }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        Acting as
      </Typography>
      <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500, mt: 0.25 }}>
        {currentUser.name} · {formatUserRole(currentUser.role)}
      </Typography>
    </Box>
  );
}
