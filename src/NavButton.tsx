import Button from '@mui/material/Button';
import { Link as RouterLink } from 'react-router-dom';

// A button that navigates to a different page or opens a modal
// It should be styled with the MUI Button component

type NavButtonProps = {
    to: string;
    external?: boolean;
    children: React.ReactNode;
  };
  
  export default function NavButton({ to, external, children }: NavButtonProps) {
    if (external) {
      return (
        <Button
          component="a"
          href={to}
          target="_blank"
          rel="noopener noreferrer"
        >
          {children}
        </Button>
      );
    }
    return (
      <Button component={RouterLink} to={to}>
        {children}
      </Button>
    );
  }
