export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  unlocked: boolean;
}

export function calculateBadges(totalMovies: number, totalMinutes: number): Badge[] {
  const allBadges: Badge[] = [
    {
      id: 'first_blood',
      name: 'Primeiro de Muitos',
      description: 'Assistiu ao seu primeiro filme.',
      icon: 'film',
      color: '#4CAF50',
      unlocked: totalMovies >= 1
    },
    {
      id: 'cinemaniac',
      name: 'Cinemaníaco',
      description: 'Assistiu 10 filmes.',
      icon: 'videocam',
      color: '#2196F3',
      unlocked: totalMovies >= 10
    },
    {
      id: 'critic',
      name: 'Crítico de Sofá',
      description: 'Assistiu 50 filmes.',
      icon: 'star',
      color: '#9C27B0',
      unlocked: totalMovies >= 50
    },
    {
      id: 'marathon',
      name: 'Maratonista',
      description: 'Acumulou mais de 24 horas (1440 min) assistindo filmes.',
      icon: 'timer',
      color: '#FF9800',
      unlocked: totalMinutes >= 1440
    },
    {
      id: 'legend',
      name: 'Lenda do Cinema',
      description: 'Assistiu mais de 100 filmes e acumulou 100+ horas.',
      icon: 'trophy',
      color: '#FFD700',
      unlocked: totalMovies >= 100 && totalMinutes >= 6000
    }
  ];

  return allBadges;
}
