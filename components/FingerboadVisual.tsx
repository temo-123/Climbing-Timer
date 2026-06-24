import React from 'react';
import { View, StyleSheet } from 'react-native';

interface HighlightConfig {
  row: number;
  cols: number[];
}

// Row 0 = slopers      — 4 wide holds
// Row 1 = medium edge  — 8 holds (4 per hand)
// Row 2 = small crimps — 10 holds (5 per hand)
const HIGHLIGHTS: Record<string, HighlightConfig[]> = {
  'fb-open-hand':  [{ row: 0, cols: [0, 1, 2, 3] }],                   // all slopers
  'fb-half-crimp': [{ row: 1, cols: [0, 1, 2, 3, 4, 5, 6, 7] }],       // all medium pockets
  'fb-full-crimp': [{ row: 2, cols: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] }], // all small crimps
  'fb-sloper':     [{ row: 0, cols: [1, 2] }],                          // centre two slopers
  'fb-two-finger': [{ row: 1, cols: [1, 2, 5, 6] }],                   // 2 fingers per hand
  'fb-pinch':      [{ row: 0, cols: [0, 3] }],                          // outer slots (pinch)
};

const ROWS = [
  { count: 4,  holdW: 44, holdH: 20 },  // slopers
  { count: 8,  holdW: 22, holdH: 16 },  // medium pockets
  { count: 10, holdW: 16, holdH: 13 },  // small crimps
];

const TEAL  = '#4ecdc4';
const DIM   = '#1e3530';
const BOARD = '#0f2018';

interface Props {
  exerciseId: string;
}

export default function FingerboadVisual({ exerciseId }: Props) {
  const highlights = HIGHLIGHTS[exerciseId] ?? [];

  const isHighlighted = (row: number, col: number) =>
    highlights.some(h => h.row === row && h.cols.includes(col));

  return (
    <View style={styles.board}>
      {ROWS.map((rowDef, rowIdx) => (
        <View key={rowIdx} style={styles.row}>
          {Array.from({ length: rowDef.count }).map((_, colIdx) => {
            const lit = isHighlighted(rowIdx, colIdx);
            const isCenter = colIdx === rowDef.count / 2;
            return (
              <React.Fragment key={colIdx}>
                {isCenter && <View style={styles.centerGap} />}
                <View
                  style={[
                    styles.hold,
                    {
                      width: rowDef.holdW,
                      height: rowDef.holdH,
                      borderRadius: rowDef.holdH / 2,
                      backgroundColor: lit ? TEAL : DIM,
                      shadowColor: lit ? TEAL : 'transparent',
                      shadowOpacity: lit ? 0.85 : 0,
                      shadowRadius: lit ? 5 : 0,
                      elevation: lit ? 5 : 0,
                    },
                  ]}
                />
              </React.Fragment>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    backgroundColor: BOARD,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1a3028',
    paddingVertical: 18,
    paddingHorizontal: 10,
    marginBottom: 14,
    gap: 10,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  centerGap: {
    width: 14,
  },
  hold: {
    borderWidth: 1,
    borderColor: '#0d2018',
  },
});
