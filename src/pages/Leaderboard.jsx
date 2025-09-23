import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { useProfile } from '../contexts/ProfileContext';
import ProfilePicture from '../components/ProfilePicture';
import { Trophy, Calendar, Star, Crown, TrendingUp } from 'lucide-react';

const LeaderboardContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
  padding: 2rem;
  color: white;

  @media (max-width: 768px) {
    padding: 1rem;
    padding-top: 100px;
  }
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const Title = styled.h1`
  font-size: 3.5rem;
  font-weight: 700;
  background: linear-gradient(45deg, #00d4ff, #0099cc, #0066ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 30px rgba(0, 212, 255, 0.5);
  margin-bottom: 1rem;
  font-family: 'Hyperwave', sans-serif;
  letter-spacing: 3px;

  @media (max-width: 768px) {
    font-size: 2.5rem;
    letter-spacing: 2px;
  }
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  color: #87ceeb;
  margin-bottom: 2rem;
  opacity: 0.8;
`;

const TabContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 3rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
  }
`;

const TabButton = styled.button`
  background: ${props => props.active 
    ? 'linear-gradient(45deg, #00d4ff, #0099cc)' 
    : 'rgba(0, 212, 255, 0.1)'};
  color: ${props => props.active ? '#000' : '#00d4ff'};
  border: 2px solid ${props => props.active ? '#00d4ff' : 'rgba(0, 212, 255, 0.3)'};
  padding: 1rem 2rem;
  border-radius: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 200px;
  justify-content: center;

  &:hover {
    background: ${props => props.active 
      ? 'linear-gradient(45deg, #00d4ff, #0099cc)' 
      : 'rgba(0, 212, 255, 0.2)'};
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(0, 212, 255, 0.3);
  }

  @media (max-width: 768px) {
    width: 100%;
    max-width: 300px;
  }
`;

const LeaderboardGrid = styled.div`
  display: grid;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const LeaderboardSection = styled.div`
  background: rgba(0, 212, 255, 0.05);
  border: 2px solid rgba(0, 212, 255, 0.2);
  border-radius: 1.5rem;
  padding: 2rem;
  backdrop-filter: blur(10px);
  box-shadow: 0 0 30px rgba(0, 212, 255, 0.1);
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid rgba(0, 212, 255, 0.2);
`;

const SectionTitle = styled.h2`
  font-size: 2rem;
  color: #00d4ff;
  margin: 0;
  font-weight: 600;
`;

const SectionIcon = styled.div`
  color: #00d4ff;
  font-size: 2rem;
`;

const LeaderboardList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const LeaderboardItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  background: rgba(0, 212, 255, 0.05);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 1rem;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    background: rgba(0, 212, 255, 0.1);
    transform: translateX(5px);
    box-shadow: 0 5px 20px rgba(0, 212, 255, 0.2);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: ${props => {
      if (props.rank === 1) return 'linear-gradient(45deg, #ffd700, #ffed4e)';
      if (props.rank === 2) return 'linear-gradient(45deg, #c0c0c0, #e5e5e5)';
      if (props.rank === 3) return 'linear-gradient(45deg, #cd7f32, #daa520)';
      return 'linear-gradient(45deg, #00d4ff, #0099cc)';
    }};
  }

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
`;

const RankBadge = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  font-weight: bold;
  font-size: 1.2rem;
  background: ${props => {
    if (props.rank === 1) return 'linear-gradient(45deg, #ffd700, #ffed4e)';
    if (props.rank === 2) return 'linear-gradient(45deg, #c0c0c0, #e5e5e5)';
    if (props.rank === 3) return 'linear-gradient(45deg, #cd7f32, #daa520)';
    return 'linear-gradient(45deg, #00d4ff, #0099cc)';
  }};
  color: ${props => props.rank <= 3 ? '#000' : '#fff'};
  box-shadow: 0 0 15px rgba(0, 212, 255, 0.3);
`;

const PlayerInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
  }
`;

const PlayerDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const PlayerName = styled.div`
  font-weight: 600;
  font-size: 1.1rem;
  color: #fff;
`;

const PlayerAddress = styled.div`
  font-size: 0.9rem;
  color: #87ceeb;
  font-family: monospace;
`;

const WinningsInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;

  @media (max-width: 768px) {
    align-items: center;
  }
`;

const WinningsAmount = styled.div`
  font-size: 1.3rem;
  font-weight: bold;
  color: #00d4ff;
`;

const WinningsLabel = styled.div`
  font-size: 0.8rem;
  color: #87ceeb;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  color: #00d4ff;
  font-size: 1.2rem;
`;

const ErrorContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  color: #ff6b6b;
  font-size: 1.2rem;
  text-align: center;
`;

const LastWeekWinner = styled.div`
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 237, 78, 0.1));
  border: 2px solid rgba(255, 215, 0, 0.3);
  border-radius: 1.5rem;
  padding: 2rem;
  margin-bottom: 2rem;
  text-align: center;
`;

const LastWeekTitle = styled.h3`
  color: #ffd700;
  font-size: 1.5rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`;

const LastWeekContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

const Leaderboard = () => {
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };
  const [activeTab, setActiveTab] = useState('all-time');
  const [allTimeLeaderboard, setAllTimeLeaderboard] = useState([]);
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState([]);
  const [lastWeekWinner, setLastWeekWinner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { getPlayerName, getProfilePicture } = useProfile();

  useEffect(() => {
    loadLeaderboardData();
  }, [activeTab]);

  const loadLeaderboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (activeTab === 'all-time') {
        await loadAllTimeLeaderboard();
      } else {
        await loadWeeklyLeaderboard();
        await loadLastWeekWinner();
      }
    } catch (err) {
      console.error('Error loading leaderboard data:', err);
      setError('Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadAllTimeLeaderboard = async () => {
    try {
      const response = await fetch('/api/leaderboard/all-time');
      if (!response.ok) throw new Error('Failed to fetch all-time leaderboard');
      
      const data = await response.json();
      
      // Enrich data with profile information
      const enrichedData = await Promise.all(
        data.map(async (player, index) => {
          const name = await getPlayerName(player.address);
          const avatar = await getProfilePicture(player.address);
          
          return {
            ...player,
            name: name || 'Anonymous',
            avatar,
            rank: index + 1
          };
        })
      );
      
      setAllTimeLeaderboard(enrichedData);
    } catch (err) {
      console.error('Error loading all-time leaderboard:', err);
      throw err;
    }
  };

  const loadWeeklyLeaderboard = async () => {
    try {
      const response = await fetch('/api/leaderboard/weekly');
      if (!response.ok) throw new Error('Failed to fetch weekly leaderboard');
      
      const data = await response.json();
      
      // Enrich data with profile information
      const enrichedData = await Promise.all(
        data.map(async (player, index) => {
          const name = await getPlayerName(player.address);
          const avatar = await getProfilePicture(player.address);
          
          return {
            ...player,
            name: name || 'Anonymous',
            avatar,
            rank: index + 1
          };
        })
      );
      
      setWeeklyLeaderboard(enrichedData);
    } catch (err) {
      console.error('Error loading weekly leaderboard:', err);
      throw err;
    }
  };

  const loadLastWeekWinner = async () => {
    try {
      const response = await fetch('/api/leaderboard/last-week-winner');
      if (!response.ok) throw new Error('Failed to fetch last week winner');
      
      const data = await response.json();
      
      if (data.address) {
        const name = await getPlayerName(data.address);
        const avatar = await getProfilePicture(data.address);
        
        setLastWeekWinner({
          ...data,
          name: name || 'Anonymous',
          avatar
        });
      }
    } catch (err) {
      console.error('Error loading last week winner:', err);
      // Don't throw here as this is not critical
    }
  };

  const renderLeaderboardItem = (player) => (
    <LeaderboardItem key={player.address} rank={player.rank}>
      <RankBadge rank={player.rank}>
        {player.rank === 1 && <Crown size={20} />}
        {player.rank === 2 && <Trophy size={20} />}
        {player.rank === 3 && <Star size={20} />}
        {player.rank > 3 && player.rank}
      </RankBadge>
      
      <PlayerInfo>
        <ProfilePicture 
          address={player.address}
          size={50}
          profileData={{ imageUrl: player.avatar }}
          style={{ borderRadius: '12px' }}
        />
        <PlayerDetails>
          <PlayerName>{player.name}</PlayerName>
          <PlayerAddress>{formatAddress(player.address)}</PlayerAddress>
        </PlayerDetails>
      </PlayerInfo>
      
      <WinningsInfo>
        <WinningsAmount>
          {formatCurrency(player.totalWinnings)}
        </WinningsAmount>
        <WinningsLabel>
          {activeTab === 'all-time' ? 'Total Winnings' : 'Weekly Winnings'}
        </WinningsLabel>
      </WinningsInfo>
    </LeaderboardItem>
  );

  if (loading) {
    return (
      <LeaderboardContainer>
        <Header>
          <Title>Leaderboard</Title>
          <Subtitle>Top players and their achievements</Subtitle>
        </Header>
        <LoadingContainer>
          Loading leaderboard data...
        </LoadingContainer>
      </LeaderboardContainer>
    );
  }

  if (error) {
    return (
      <LeaderboardContainer>
        <Header>
          <Title>Leaderboard</Title>
          <Subtitle>Top players and their achievements</Subtitle>
        </Header>
        <ErrorContainer>
          {error}
        </ErrorContainer>
      </LeaderboardContainer>
    );
  }

  return (
    <LeaderboardContainer>
      <Header>
        <Title>Leaderboard</Title>
        <Subtitle>Top players and their achievements</Subtitle>
      </Header>

      <TabContainer>
        <TabButton 
          active={activeTab === 'all-time'} 
          onClick={() => setActiveTab('all-time')}
        >
          <Trophy size={20} />
          All-Time Winners
        </TabButton>
        <TabButton 
          active={activeTab === 'weekly'} 
          onClick={() => setActiveTab('weekly')}
        >
          <Calendar size={20} />
          Weekly Winners
        </TabButton>
      </TabContainer>

      <LeaderboardGrid>
        {activeTab === 'all-time' ? (
          <LeaderboardSection>
            <SectionHeader>
              <SectionIcon>
                <Trophy size={32} />
              </SectionIcon>
              <SectionTitle>All-Time Highest Winners</SectionTitle>
            </SectionHeader>
            
            <LeaderboardList>
              {allTimeLeaderboard.length > 0 ? (
                allTimeLeaderboard.map(renderLeaderboardItem)
              ) : (
                <div style={{ textAlign: 'center', color: '#87ceeb', padding: '2rem' }}>
                  No data available yet
                </div>
              )}
            </LeaderboardList>
          </LeaderboardSection>
        ) : (
          <>
            {lastWeekWinner && (
              <LastWeekWinner>
                <LastWeekTitle>
                  <Crown size={24} />
                  Last Week's Winner
                </LastWeekTitle>
                <LastWeekContent>
                  <ProfilePicture 
                    address={lastWeekWinner.address}
                    size={80}
                    profileData={{ imageUrl: lastWeekWinner.avatar }}
                    style={{ borderRadius: '16px' }}
                  />
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ffd700', marginBottom: '0.5rem' }}>
                      {lastWeekWinner.name}
                    </div>
                    <div style={{ color: '#87ceeb', marginBottom: '0.5rem' }}>
                      {formatAddress(lastWeekWinner.address)}
                    </div>
                    <div style={{ fontSize: '1.2rem', color: '#00d4ff', fontWeight: 'bold' }}>
                      {formatCurrency(lastWeekWinner.totalWinnings)}
                    </div>
                  </div>
                </LastWeekContent>
              </LastWeekWinner>
            )}

            <LeaderboardSection>
              <SectionHeader>
                <SectionIcon>
                  <TrendingUp size={32} />
                </SectionIcon>
                <SectionTitle>This Week's Top Players</SectionTitle>
              </SectionHeader>
              
              <LeaderboardList>
                {weeklyLeaderboard.length > 0 ? (
                  weeklyLeaderboard.map(renderLeaderboardItem)
                ) : (
                  <div style={{ textAlign: 'center', color: '#87ceeb', padding: '2rem' }}>
                    No data available yet
                  </div>
                )}
              </LeaderboardList>
            </LeaderboardSection>
          </>
        )}
      </LeaderboardGrid>
    </LeaderboardContainer>
  );
};

export default Leaderboard; 