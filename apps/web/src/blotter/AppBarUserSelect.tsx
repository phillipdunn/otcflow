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

/** User picker only — current user label lives in {@link BlotterToolbar}. */
export function AppBarUserSelect() {
  const { currentUser, setCurrentUserId, users } = useCurrentUser();

  return (
    <FormControl size="small" sx={headerSelectSx}>
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
