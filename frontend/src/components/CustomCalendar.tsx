import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface CustomCalendarProps {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (date: string) => void;
  initialDate?: string;
}

export default function CustomCalendar({ visible, onClose, onSelectDate, initialDate }: CustomCalendarProps) {
  const { theme, isDark } = useTheme();
  const [currentDate, setCurrentDate] = useState(initialDate ? new Date(initialDate) : new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleSelectDay = (day: number) => {
    const selected = new Date(year, month, day);
    const dateStr = selected.toISOString().split('T')[0];
    onSelectDate(dateStr);
    onClose();
  };

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.calendarContainer, { backgroundColor: theme.colors.card }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn}>
              <Text style={{ color: theme.colors.primary, fontSize: 18 }}>◀</Text>
            </TouchableOpacity>
            <Text style={[styles.monthTitle, { color: theme.colors.text }]}>{monthNames[month]} {year}</Text>
            <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn}>
              <Text style={{ color: theme.colors.primary, fontSize: 18 }}>▶</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.weekRow}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
              <Text key={d} style={styles.weekLabel}>{d}</Text>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {days.map((day, i) => (
              <TouchableOpacity 
                key={i} 
                disabled={!day}
                style={[
                  styles.dayBox, 
                  initialDate === `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` && { backgroundColor: theme.colors.primary }
                ]}
                onPress={() => day && handleSelectDay(day)}
              >
                <Text style={[
                  styles.dayText, 
                  { color: day ? theme.colors.text : 'transparent' },
                  initialDate === `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` && { color: '#FFF' }
                ]}>
                  {day}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={[styles.closeBtnText, { color: theme.colors.textSecondary }]}>CANCEL</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  calendarContainer: { width: '100%', borderRadius: 32, padding: 24, elevation: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  monthTitle: { fontSize: 18, fontWeight: '900' },
  navBtn: { padding: 10 },
  weekRow: { flexDirection: 'row', marginBottom: 12 },
  weekLabel: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '800', color: '#888' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayBox: { width: '14.28%', height: 45, justifyContent: 'center', alignItems: 'center', borderRadius: 12 },
  dayText: { fontSize: 14, fontWeight: '700' },
  closeBtn: { marginTop: 24, alignItems: 'center' },
  closeBtnText: { fontSize: 12, fontWeight: '900', letterSpacing: 1 },
});
