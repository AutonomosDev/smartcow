/**
 * A single chat message bubble.
 * Renders plain text, code blocks (monospace), and simple tables.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ChatMessage } from '../types';

interface Props {
  message: ChatMessage;
}

/**
 * Very basic markdown-lite renderer:
 * - ```...``` → code block
 * - | ... | ... | → table row
 * - everything else → plain text
 */
function renderContent(content: string) {
  // Split on code blocks
  const parts = content.split(/(```[\s\S]*?```)/g);
  return parts.map((part, i) => {
    if (part.startsWith('```')) {
      const code = part.replace(/^```[^\n]*\n?/, '').replace(/```$/, '');
      return (
        <View key={i} style={styles.codeBlock}>
          <Text style={styles.codeText} selectable>
            {code.trim()}
          </Text>
        </View>
      );
    }
    // Check for table lines
    const lines = part.split('\n');
    const tableChunks: { type: 'table' | 'text'; lines: string[] }[] = [];
    let current: { type: 'table' | 'text'; lines: string[] } = { type: 'text', lines: [] };

    for (const line of lines) {
      const isTableRow = /^\s*\|/.test(line);
      if (isTableRow) {
        if (current.type !== 'table') {
          if (current.lines.length > 0) {
            tableChunks.push(current);
          }
          current = { type: 'table', lines: [] };
        }
        current.lines.push(line);
      } else {
        if (current.type !== 'text') {
          tableChunks.push(current);
          current = { type: 'text', lines: [] };
        }
        current.lines.push(line);
      }
    }
    if (current.lines.length > 0) {
      tableChunks.push(current);
    }

    return tableChunks.map((chunk, j) => {
      if (chunk.type === 'table') {
        return (
          <View key={`${i}-${j}`} style={styles.table}>
            {chunk.lines
              .filter(l => !/^\s*\|[-| :]+\|/.test(l)) // skip separator rows
              .map((row, k) => {
                const cells = row
                  .split('|')
                  .map(c => c.trim())
                  .filter(Boolean);
                return (
                  <View key={k} style={styles.tableRow}>
                    {cells.map((cell, m) => (
                      <Text key={m} style={styles.tableCell} selectable>
                        {cell}
                      </Text>
                    ))}
                  </View>
                );
              })}
          </View>
        );
      }
      return (
        <Text key={`${i}-${j}`} style={styles.text} selectable>
          {chunk.lines.join('\n').trim()}
        </Text>
      );
    });
  });
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        {renderContent(message.content)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  rowAssistant: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: {
    backgroundColor: '#16a34a',
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: '#f1f5f9',
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 15,
    lineHeight: 21,
    color: '#1e293b',
  },
  codeBlock: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 10,
    marginVertical: 4,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#e2e8f0',
    lineHeight: 18,
  },
  table: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    overflow: 'hidden',
    marginVertical: 6,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableCell: {
    flex: 1,
    fontSize: 12,
    color: '#334155',
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
  },
});
