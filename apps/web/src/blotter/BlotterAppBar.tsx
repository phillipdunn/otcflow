import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import { blotterChrome } from '../blotterTheme.js';
import { AppBarUserSelect } from './AppBarUserSelect.js';

export interface BlotterAppBarProps {
  onNewTrade: () => void;
  newTradeDisabled?: boolean;
}

export function BlotterAppBar({ onNewTrade, newTradeDisabled = false }: BlotterAppBarProps) {
  return (
    <AppBar position="static">
      <Toolbar variant="dense" sx={{ gap: 1, flexWrap: { xs: 'wrap', sm: 'nowrap' }, py: { xs: 1, sm: 0 } }}>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="h6" component="h1" sx={{ color: 'inherit' }}>
            OTCFlow
          </Typography>
          <Typography variant="caption" sx={{ color: blotterChrome.headerMuted, display: 'block', mt: 0.25 }}>
            OTC trade blotter · REST + TanStack Query + realtime
          </Typography>
        </Box>
        <AppBarUserSelect />
        <Button
          variant="contained"
          size="medium"
          startIcon={<AddIcon />}
          onClick={onNewTrade}
          disabled={newTradeDisabled}
          disableElevation
          sx={{
            flexShrink: 0,
            fontWeight: 600,
            textTransform: 'none',
            bgcolor: blotterChrome.headerCtaBg,
            color: blotterChrome.headerCtaText,
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.22)',
            border: '1px solid rgba(226, 232, 240, 0.9)',
            '&:hover': {
              bgcolor: blotterChrome.headerCtaHoverBg,
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.28)',
            },
            '&:disabled': {
              bgcolor: 'rgba(248, 250, 252, 0.55)',
              color: 'rgba(15, 23, 42, 0.42)',
              borderColor: 'rgba(226, 232, 240, 0.5)',
            },
          }}
        >
          New trade
        </Button>
      </Toolbar>
    </AppBar>
  );
}
