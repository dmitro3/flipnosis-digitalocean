import React from 'react';
import styled from '@emotion/styled';
import { Palette, Check } from 'lucide-react';

const ThemeSelectorContainer = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 20, 147, 0.2);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
`;

const ThemeSelectorHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  
  h3 {
    color: #fff;
    font-size: 1.2rem;
    font-weight: bold;
    margin: 0;
  }
`;

const ThemeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
`;

const ThemeOption = styled.div`
  position: relative;
  cursor: pointer;
  border-radius: 0.75rem;
  padding: 1rem;
  text-align: center;
  transition: all 0.3s ease;
  border: 2px solid ${props => props.selected ? props.theme.border : 'transparent'};
  background: ${props => props.theme.background};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  }
`;

const ThemeColor = styled.div`
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  margin: 0 auto 0.5rem;
  background: ${props => props.color};
  border: 2px solid rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ThemeName = styled.div`
  color: #fff;
  font-weight: bold;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
`;

const ThemeDescription = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.8rem;
`;

const SelectedIndicator = styled.div`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  background: ${props => props.theme.accent};
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 0.8rem;
`;

// Theme definitions
export const themes = {
  purple: {
    name: 'Purple',
    description: 'Classic purple theme',
    primary: '#FF1493',
    secondary: '#FF69B4',
    accent: '#9C27B0',
    background: 'linear-gradient(135deg, rgba(255, 20, 147, 0.1), rgba(255, 105, 180, 0.1))',
    border: 'rgba(255, 20, 147, 0.5)',
    color: '#FF1493'
  },
  green: {
    name: 'Green',
    description: 'Fresh green theme',
    primary: '#00FF41',
    secondary: '#39FF14',
    accent: '#4CAF50',
    background: 'linear-gradient(135deg, rgba(0, 255, 65, 0.1), rgba(57, 255, 20, 0.1))',
    border: 'rgba(0, 255, 65, 0.5)',
    color: '#00FF41'
  },
  blue: {
    name: 'Blue',
    description: 'Electric blue theme',
    primary: '#00BFFF',
    secondary: '#1E90FF',
    accent: '#4169E1',
    background: 'linear-gradient(135deg, rgba(0, 191, 255, 0.1), rgba(30, 144, 255, 0.1))',
    border: 'rgba(0, 191, 255, 0.5)',
    color: '#00BFFF'
  },
  orange: {
    name: 'Orange',
    description: 'Warm orange theme',
    primary: '#FF9800',
    secondary: '#FF5722',
    accent: '#F57C00',
    background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.1), rgba(255, 87, 34, 0.1))',
    border: 'rgba(255, 152, 0, 0.5)',
    color: '#FF9800'
  },
  yellow: {
    name: 'Yellow',
    description: 'Bright yellow theme',
    primary: '#FFC107',
    secondary: '#FFEB3B',
    accent: '#FFA000',
    background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.1), rgba(255, 235, 59, 0.1))',
    border: 'rgba(255, 193, 7, 0.5)',
    color: '#FFC107'
  },
  white: {
    name: 'White',
    description: 'Clean white theme',
    primary: '#FFFFFF',
    secondary: '#F5F5F5',
    accent: '#E0E0E0',
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(245, 245, 245, 0.1))',
    border: 'rgba(255, 255, 255, 0.5)',
    color: '#FFFFFF'
  }
};

const ThemeSelector = ({ selectedTheme, onThemeChange, saving }) => {
  return (
    <ThemeSelectorContainer>
      <ThemeSelectorHeader>
        <Palette style={{ width: '1.5rem', height: '1.5rem', color: '#00BFFF' }} />
        <h3>Profile Theme</h3>
      </ThemeSelectorHeader>
      
      <ThemeGrid>
        {Object.entries(themes).map(([key, theme]) => (
          <ThemeOption
            key={key}
            theme={theme}
            selected={selectedTheme === key}
            onClick={() => !saving && onThemeChange(key)}
            style={{ opacity: saving ? 0.6 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}
          >
            {selectedTheme === key && (
              <SelectedIndicator theme={theme}>
                <Check style={{ width: '1rem', height: '1rem' }} />
              </SelectedIndicator>
            )}
            
            <ThemeColor color={theme.color} />
            <ThemeName>{theme.name}</ThemeName>
            <ThemeDescription>{theme.description}</ThemeDescription>
          </ThemeOption>
        ))}
      </ThemeGrid>
    </ThemeSelectorContainer>
  );
};

export default ThemeSelector; 