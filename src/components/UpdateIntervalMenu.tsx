import React, { useState } from 'react';
import { Menu, MenuItem, Button } from '@mui/material';

interface UpdateIntervalMenuProps {
    updateInterval: '1s' | '10s' | '1m' | '10m' | '1h' | '1d';
    onIntervalChange?: (interval: '1s' | '10s' | '1m' | '10m' | '1h' | '1d') => void;
}

export default function UpdateIntervalMenu({ updateInterval, onIntervalChange }: UpdateIntervalMenuProps) {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleMenuItemClick = (interval: '1s' | '10s' | '1m' | '10m' | '1h' | '1d') => {
        onIntervalChange?.(interval);
        handleClose();
    };

    return (
        <>
            <Button sx={{ padding: 0, margin: 0 }} onClick={handleClick}>
                Update Frequency: {updateInterval}
            </Button>
            <Menu
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
            >
                <MenuItem onClick={() => handleMenuItemClick('1s')}>1s</MenuItem>
                <MenuItem onClick={() => handleMenuItemClick('10s')}>10s</MenuItem>
                <MenuItem onClick={() => handleMenuItemClick('1m')}>1m</MenuItem>
                <MenuItem onClick={() => handleMenuItemClick('10m')}>10m</MenuItem>
                <MenuItem onClick={() => handleMenuItemClick('1h')}>1h</MenuItem>
                <MenuItem onClick={() => handleMenuItemClick('1d')}>1d</MenuItem>
            </Menu>
        </>
    );
}