<GameFlipButton
  as={Link}
  to={`/battle-royale/${selectedFlip.id}`}
  style={{ 
    background: selectedFlip.status === 'completed' ? theme.colors.neonBlue : theme.colors.neonPink 
  }}
>
  {selectedFlip.status === 'completed' ? 'VIEW RESULTS' : 'VIEW GAME'}
</GameFlipButton> 