import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import { AppBarUserSelect } from './AppBarUserSelect.js';
import { BlotterSimulatorControls } from './BlotterSimulatorControls.js';

/** Reserve space so the grid is not covered by the fixed dock. */
export const BLOTTER_DEV_DOCK_HEIGHT_PX = 56;

/**
 * Sticky demo/dev controls (Phase 6 acting-as + Phase 8 simulator).
 * Intentionally separated from production toolbar chrome — remove when auth + real feeds ship.
 */
export function BlotterDevDock() {
  return (
    <Paper
      component="nav"
      aria-label="Demo development controls"
      elevation={8}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: (theme) => theme.zIndex.appBar,
        borderRadius: 0,
        borderTop: 1,
        borderColor: 'divider',
        px: 2,
        py: 1,
        bgcolor: 'background.paper',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
          gap: 1,
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          sx={{ flexWrap: 'nowrap', alignItems: 'center', minWidth: 0 }}
        >
          <Chip label="Demo only" size="small" color="warning" variant="outlined" sx={{ height: 22, flexShrink: 0 }} />
          <AppBarUserSelect variant="dock" />
        </Stack>
        <BlotterSimulatorControls />
      </Box>
    </Paper>
  );
}
