import Button from '@mui/material/Button';
import { Link as RouterLink } from 'react-router-dom';
import { SxProps, Theme } from '@mui/material/styles';

// A button that navigates to a different page or opens a modal
// It should be styled with the MUI Button component

type NavButtonProps = {
  to: string;
  external?: boolean;
  children: React.ReactNode;
  sx?: SxProps<Theme>;
  dataTestId?: string;
};
  
export default function NavButton({ to, external, children, sx, dataTestId }: NavButtonProps) {
  if (external) {
    return (
      <Button
        component="a"
        href={to}
        target="_blank"
        rel="noopener noreferrer"
        sx={sx}
        data-testid={dataTestId}
      >
        {children}
      </Button>
    );
  }
  return (
    <Button component={RouterLink} to={to} sx={sx} data-testid={dataTestId}>
      {children}
    </Button>
  );
}
