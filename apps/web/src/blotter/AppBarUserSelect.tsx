import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { blotterChrome } from '../blotterTheme.js';
import { useCurrentUser } from './currentUserContext.js';
import { formatUserRole } from './formatUserRole.js';

const headerSelectSx = {
  minWidth: { xs: 160, sm: 200 },
  flexShrink: 0,
  mr: 1.5,
  '& .MuiInputLabel-root': { color: blotterChrome.headerMuted },
  '& .MuiOutlinedInput-root': {
    color: blotterChrome.headerGhostText,
    '& fieldset': { borderColor: blotterChrome.headerGhostBorder },
    '&:hover fieldset': { borderColor: blotterChrome.headerGhostHoverBorder },
    '&.Mui-focused fieldset': { borderColor: blotterChrome.headerGhostHoverBorder },
  },
  '& .MuiSvgIcon-root': { color: blotterChrome.headerMuted },
};

const dockSelectSx = {
  minWidth: { xs: '100%', sm: 220 },
  flexShrink: 0,
};

export interface AppBarUserSelectProps {
  /** `header` = top app bar (light on dark). `dock` = bottom demo bar (standard theme). */
  variant?: 'header' | 'dock';
}

/** Acting-as user picker (demo / Phase 6). */
export function AppBarUserSelect({ variant = 'header' }: AppBarUserSelectProps) {
  const { currentUser, setCurrentUserId, users } = useCurrentUser();

  return (
    <FormControl size="small" sx={variant === 'header' ? headerSelectSx : dockSelectSx}>
      <InputLabel id="appbar-user-label">Acting as</InputLabel>
      <Select
        labelId="appbar-user-label"
        label="Acting as"
        value={currentUser.id}
        onChange={(e) => setCurrentUserId(e.target.value)}
      >
        {users.map((user) => (
          <MenuItem key={user.id} value={user.id}>
            {user.name} ({formatUserRole(user.role)})
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
