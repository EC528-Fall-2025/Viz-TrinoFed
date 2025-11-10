import BasicCard, { CardProps } from './Card';
import { Box } from '@mui/material';

export type CardListProps = {
    cards: CardProps[];
}

export default function CardList({ cards }: CardListProps) {
    return (
        <Box>
            <ul>
                {cards.map((card, index) => (
                    <li key={index}>
                        <BasicCard 
                            key={index} 
                            title={card.title} 
                            description={card.description} 
                            status={card.status} 
                            timestamp={card.timestamp}
                            onClick={card.onClick}
                        />
                    </li>
                ))}
            </ul>
        </Box>
    );
}