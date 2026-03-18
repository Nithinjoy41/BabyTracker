import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Dimensions, 
  Animated, PanResponder, StatusBar, SafeAreaView 
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');
const GRID_SIZE = 10;
const BOARD_SIZE = Math.min(width - 40, 400); // Max 400 for larger screens
const CELL_SIZE = Math.floor(BOARD_SIZE / GRID_SIZE);

export default function BabyPacman({ navigation, route }: any) {
  const { babyName } = route.params || { babyName: 'Leo' };
  const { theme } = useTheme();

  const [babyPos, setBabyPos] = useState({ x: 0, y: 0 });
  const [foods, setFoods] = useState<{x: number, y: number, type: string}[]>([]);
  const [score, setScore] = useState(0);
  const [gameStatus, setGameStatus] = useState<'PLAYING' | 'WON'>('PLAYING');

  const foodTypes = ['🍎', '🍌', '🥦', '🥕', '🍓', '🍇'];

  // Initialize food with validation
  useEffect(() => {
    const newFoods: {x: number, y: number, type: string}[] = [];
    const occupied = new Set<string>();
    occupied.add('0,0'); // Don't spawn on baby

    let count = 0;
    while(count < 15) {
      const rx = Math.floor(Math.random() * GRID_SIZE);
      const ry = Math.floor(Math.random() * GRID_SIZE);
      const key = `${rx},${ry}`;
      
      if (!occupied.has(key)) {
        occupied.add(key);
        newFoods.push({
          x: rx,
          y: ry,
          type: foodTypes[Math.floor(Math.random() * foodTypes.length)]
        });
        count++;
      }
    }
    setFoods(newFoods);
  }, []);

  const moveBaby = (dx: number, dy: number) => {
    if (gameStatus === 'WON') return;

    setBabyPos(prev => {
      let nx = prev.x + dx;
      let ny = prev.y + dy;

      // Wrap around logic
      if (nx < 0) nx = GRID_SIZE - 1;
      if (nx >= GRID_SIZE) nx = 0;
      if (ny < 0) ny = GRID_SIZE - 1;
      if (ny >= GRID_SIZE) ny = 0;

      return { x: nx, y: ny };
    });
  };

  // Check for food after baby moves
  useEffect(() => {
      const foodIndex = foods.findIndex(f => f.x === babyPos.x && f.y === babyPos.y);
      if (foodIndex !== -1) {
        const newFoods = [...foods];
        newFoods.splice(foodIndex, 1);
        setFoods(newFoods);
        setScore(s => s + 10);
        
        if (newFoods.length === 0) {
          setGameStatus('WON');
        }
      }
  }, [babyPos, foods]);

  // Swiping Controls
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10;
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dx, dy } = gestureState;
        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx > 20) moveBaby(1, 0); // Right
          else if (dx < -20) moveBaby(-1, 0); // Left
        } else {
          if (dy > 20) moveBaby(0, 1); // Down
          else if (dy < -20) moveBaby(0, -1); // Up
        }
      },
    })
  ).current;

  return (
    <View style={[styles.container, { backgroundColor: '#000' }]} {...panResponder.panHandlers}>
      <StatusBar barStyle="light-content" />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topNav}>
          <TouchableOpacity 
            style={styles.closeBtn} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>{babyName}'s Snack Quest 😋</Text>
          <Text style={styles.score}>Growing Big · Score: {score}</Text>
        </View>
        
        <View style={[styles.gameBoard, { width: BOARD_SIZE, height: BOARD_SIZE }]}>
          {foods.map((food, i) => (
            <Text key={`${food.x}-${food.y}`} style={[styles.food, { left: food.x * CELL_SIZE, top: food.y * CELL_SIZE }]}>
              {food.type}
            </Text>
          ))}
          <View style={[styles.baby, { left: babyPos.x * CELL_SIZE, top: babyPos.y * CELL_SIZE }]}>
             <Text style={styles.babyEmoji}>👶</Text>
          </View>

          {gameStatus === 'WON' && (
            <View style={styles.winOverlay}>
              <Text style={styles.winText}>YAY! {babyName.toUpperCase()} IS FULL! 🎉</Text>
              <TouchableOpacity style={styles.btn} onPress={() => navigation.goBack()}>
                <Text style={styles.btnText}>Back to Dashboard</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.controls}>
          <View style={styles.row}>
             <ControlBtn icon="⬆️" onPress={() => moveBaby(0, -1)} />
          </View>
          <View style={styles.row}>
             <ControlBtn icon="⬅️" onPress={() => moveBaby(-1, 0)} />
             <View style={{ width: CELL_SIZE * 1.5 }} />
             <ControlBtn icon="➡️" onPress={() => moveBaby(1, 0)} />
          </View>
          <View style={styles.row}>
             <ControlBtn icon="⬇️" onPress={() => moveBaby(0, 1)} />
          </View>
        </View>

        <TouchableOpacity style={styles.bottomExit} onPress={() => navigation.goBack()}>
          <Text style={styles.bottomExitText}>Exit Game</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

function ControlBtn({ icon, onPress }: any) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.controlBtn}>
      <Text style={{ fontSize: 32 }}>{icon}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, alignItems: 'center' },
  topNav: { width: '100%', paddingHorizontal: 20, paddingTop: 10, flexDirection: 'row', justifyContent: 'flex-end' },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  closeIcon: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  header: { alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '900', color: '#FFF' },
  score: { color: '#6C63FF', fontSize: 16, marginTop: 4, fontWeight: '800' },
  gameBoard: {
    backgroundColor: '#111',
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 4,
    borderColor: '#222',
  },
  baby: { position: 'absolute', width: CELL_SIZE, height: CELL_SIZE, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  babyEmoji: { fontSize: CELL_SIZE * 0.75 },
  food: { position: 'absolute', width: CELL_SIZE, height: CELL_SIZE, textAlign: 'center', verticalAlign: 'middle', fontSize: CELL_SIZE * 0.55 },
  controls: { marginTop: 30, alignItems: 'center', gap: 10 },
  row: { flexDirection: 'row', gap: 10 },
  controlBtn: { width: 66, height: 66, borderRadius: 33, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  bottomExit: { marginTop: 'auto', marginBottom: 20, paddingVertical: 10, paddingHorizontal: 30, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)' },
  bottomExitText: { color: '#888', fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  winOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: 30 },
  winText: { fontSize: 28, fontWeight: '900', color: '#FFD700', textAlign: 'center', marginBottom: 30, lineHeight: 40 },
  btn: { backgroundColor: '#6C63FF', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 25, elevation: 5 },
  btnText: { color: '#FFF', fontWeight: '800', fontSize: 18 }
});
