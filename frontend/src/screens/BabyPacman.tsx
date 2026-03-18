import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, PanResponder } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');
const GRID_SIZE = 10;
const CELL_SIZE = Math.floor((width - 40) / GRID_SIZE);

export default function BabyPacman({ navigation, route }: any) {
  const { babyName } = route.params || { babyName: 'Leo' };
  const { theme } = useTheme();

  const [babyPos, setBabyPos] = useState({ x: 0, y: 0 });
  const [foods, setFoods] = useState<{x: number, y: number, type: string}[]>([]);
  const [score, setScore] = useState(0);
  const [gameStatus, setGameStatus] = useState<'PLAYING' | 'WON'>('PLAYING');

  const foodTypes = ['🍎', '🍌', '🥦', '🥕', '🍓', '🍇'];

  // Initialize food
  useEffect(() => {
    const newFoods = [];
    for (let i = 0; i < 15; i++) {
      newFoods.push({
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
        type: foodTypes[Math.floor(Math.random() * foodTypes.length)]
      });
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

      // Check for food
      const foodIndex = foods.findIndex(f => f.x === nx && f.y === ny);
      if (foodIndex !== -1) {
        const newFoods = [...foods];
        newFoods.splice(foodIndex, 1);
        setFoods(newFoods);
        setScore(s => s + 10);
        
        if (newFoods.length === 0) {
          setGameStatus('WON');
        }
      }

      return { x: nx, y: ny };
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{babyName}'s Snack Quest 😋</Text>
        <Text style={styles.score}>Level: Growing Big · Score: {score}</Text>
      </View>
      
      <View style={styles.gameBoard}>
        {foods.map((food, i) => (
          <Text key={i} style={[styles.food, { left: food.x * CELL_SIZE, top: food.y * CELL_SIZE }]}>
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

      <TouchableOpacity style={styles.exitBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.exitText}>Exit</Text>
      </TouchableOpacity>
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
  container: { flex: 1, paddingTop: 60, alignItems: 'center' },
  header: { alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '900', color: '#FFF' },
  score: { color: '#AAA', fontSize: 16, marginTop: 4, fontWeight: '700' },
  gameBoard: {
    width: width - 40,
    height: width - 40,
    backgroundColor: '#111',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#333'
  },
  baby: { position: 'absolute', width: CELL_SIZE, height: CELL_SIZE, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  babyEmoji: { fontSize: CELL_SIZE * 0.8 },
  food: { position: 'absolute', width: CELL_SIZE, height: CELL_SIZE, textAlign: 'center', verticalAlign: 'middle', fontSize: CELL_SIZE * 0.6 },
  controls: { marginTop: 40, alignItems: 'center', gap: 10 },
  row: { flexDirection: 'row', gap: 10 },
  controlBtn: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#444' },
  exitBtn: { marginTop: 40 },
  exitText: { color: '#555', fontSize: 16, fontWeight: '700' },
  winOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: 30 },
  winText: { fontSize: 32, fontWeight: '900', color: '#FFD700', textAlign: 'center', marginBottom: 30 },
  btn: { backgroundColor: '#6C63FF', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 25 },
  btnText: { color: '#FFF', fontWeight: '800', fontSize: 18 }
});
