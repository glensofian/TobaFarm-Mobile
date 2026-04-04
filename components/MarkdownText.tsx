import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

/* ============================================================
   Supported:
     **bold**        → Montserrat-Bold
     *italic*        → Montserrat-Italic
     ***bold-italic***
     `code`          → inline code highlight (Montserrat-Medium)
     # / ## / ###    → heading (SemiBold / Bold)
     - / * / +       → unordered list
     1. 2.           → ordered list
     ---             → horizontal separator
     blank line      → paragraph gap
     ```block```     → code block
   ============================================================ */

interface Props {
  text: string;
  fontSize?: number;
  color?: string;
}

// --- Inline span types ---
type Span =
  | { kind: 'text'; value: string }
  | { kind: 'bold'; value: string }
  | { kind: 'italic'; value: string }
  | { kind: 'bold-italic'; value: string }
  | { kind: 'code'; value: string };

function parseInline(raw: string): Span[] {
  const spans: Span[] = [];
  const pattern = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/gs;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(raw)) !== null) {
    if (match.index > lastIndex) {
      spans.push({ kind: 'text', value: raw.slice(lastIndex, match.index) });
    }
    if (match[2] !== undefined) {
      spans.push({ kind: 'bold-italic', value: match[2] });
    } else if (match[3] !== undefined) {
      spans.push({ kind: 'bold', value: match[3] });
    } else if (match[4] !== undefined) {
      spans.push({ kind: 'italic', value: match[4] });
    } else if (match[5] !== undefined) {
      spans.push({ kind: 'code', value: match[5] });
    }
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < raw.length) {
    spans.push({ kind: 'text', value: raw.slice(lastIndex) });
  }

  return spans;
}

// ---- Renders a single line with inline formatting ----
function InlineText({
  raw,
  baseFontSize,
  baseColor,
  extraStyle,
}: {
  raw: string;
  baseFontSize: number;
  baseColor: string;
  extraStyle?: object;
}) {
  const spans = parseInline(raw);

  return (
    <Text
      selectable
      style={[
        {
          fontFamily: 'Montserrat-Regular',
          fontSize: baseFontSize,
          color: baseColor,
          lineHeight: baseFontSize * 1.65,
        },
        extraStyle,
      ]}
    >
      {spans.map((span, i) => {
        switch (span.kind) {
          case 'bold':
            return (
              <Text key={i} style={{ fontFamily: 'Montserrat-Bold' }}>
                {span.value}
              </Text>
            );
          case 'italic':
            return (
              <Text key={i} style={{ fontFamily: 'Montserrat-Italic' }}>
                {span.value}
              </Text>
            );
          case 'bold-italic':
            return (
              <Text key={i} style={{ fontFamily: 'Montserrat-BoldItalic' }}>
                {span.value}
              </Text>
            );
          case 'code':
            return (
              <Text
                key={i}
                style={{
                  fontFamily: 'Montserrat-Medium',
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  color: '#f0c27f',
                  paddingHorizontal: 3,
                  borderRadius: 3,
                }}
              >
                {' '}{span.value}{' '}
              </Text>
            );
          default:
            return <Text key={i}>{span.value}</Text>;
        }
      })}
    </Text>
  );
}

// ---- Block types ----
type Block =
  | { kind: 'paragraph'; raw: string }
  | { kind: 'h1'; raw: string }
  | { kind: 'h2'; raw: string }
  | { kind: 'h3'; raw: string }
  | { kind: 'bullet'; raw: string }
  | { kind: 'ordered'; index: number; raw: string }
  | { kind: 'hr' }
  | { kind: 'code-block'; raw: string }
  | { kind: 'empty' };

function parseBlocks(text: string): Block[] {
  const lines = text.split('\n');
  const blocks: Block[] = [];
  let codeBuffer: string[] = [];
  let inCode = false;

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      if (inCode) {
        blocks.push({ kind: 'code-block', raw: codeBuffer.join('\n') });
        codeBuffer = [];
        inCode = false;
      } else {
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      codeBuffer.push(line);
      continue;
    }

    if (/^---+$/.test(line.trim())) { blocks.push({ kind: 'hr' }); continue; }
    if (/^# (.+)/.test(line))       { blocks.push({ kind: 'h1', raw: line.replace(/^# /, '') }); continue; }
    if (/^## (.+)/.test(line))      { blocks.push({ kind: 'h2', raw: line.replace(/^## /, '') }); continue; }
    if (/^### (.+)/.test(line))     { blocks.push({ kind: 'h3', raw: line.replace(/^### /, '') }); continue; }

    const bullet = line.match(/^\s*[*\-+] (.+)/);
    if (bullet)                     { blocks.push({ kind: 'bullet', raw: bullet[1] }); continue; }

    const ordered = line.match(/^(\d+)\. (.+)/);
    if (ordered)                    { blocks.push({ kind: 'ordered', index: parseInt(ordered[1], 10), raw: ordered[2] }); continue; }

    if (line.trim() === '')         { blocks.push({ kind: 'empty' }); continue; }

    blocks.push({ kind: 'paragraph', raw: line });
  }

  if (inCode && codeBuffer.length > 0) {
    blocks.push({ kind: 'code-block', raw: codeBuffer.join('\n') });
  }

  return blocks;
}

// ---- Main Component ----
export default function MarkdownText({ text, fontSize = 13, color = '#E6ECF2' }: Props) {
  const blocks = parseBlocks(text);

  return (
    <View>
      {blocks.map((block, i) => {
        switch (block.kind) {

          case 'h1':
            return (
              <InlineText
                key={i}
                raw={block.raw}
                baseFontSize={fontSize + 7}
                baseColor={color}
                extraStyle={[styles.h1]}
              />
            );

          case 'h2':
            return (
              <InlineText
                key={i}
                raw={block.raw}
                baseFontSize={fontSize + 4}
                baseColor={color}
                extraStyle={[styles.h2]}
              />
            );

          case 'h3':
            return (
              <InlineText
                key={i}
                raw={block.raw}
                baseFontSize={fontSize + 2}
                baseColor={color}
                extraStyle={[styles.h3]}
              />
            );

          case 'bullet':
            return (
              <View key={i} style={styles.listRow}>
                <Text style={[styles.bulletDot, { color, fontSize }]}>{'•'}</Text>
                <InlineText
                  raw={block.raw}
                  baseFontSize={fontSize}
                  baseColor={color}
                  extraStyle={{ flex: 1 }}
                />
              </View>
            );

          case 'ordered':
            return (
              <View key={i} style={styles.listRow}>
                <Text style={[styles.orderedNum, { color, fontSize }]}>
                  {block.index}.
                </Text>
                <InlineText
                  raw={block.raw}
                  baseFontSize={fontSize}
                  baseColor={color}
                  extraStyle={{ flex: 1 }}
                />
              </View>
            );

          case 'hr':
            return (
              <View key={i} style={[styles.hr, { borderBottomColor: color + '55' }]} />
            );

          case 'code-block':
            return (
              <View key={i} style={styles.codeBlock}>
                <Text
                  selectable
                  style={[styles.codeBlockText, { fontSize: fontSize - 1 }]}
                >
                  {block.raw}
                </Text>
              </View>
            );

          case 'empty':
            return <View key={i} style={{ height: 5 }} />;

          case 'paragraph':
          default:
            return (
              <InlineText
                key={i}
                raw={block.raw}
                baseFontSize={fontSize}
                baseColor={color}
                extraStyle={{ marginBottom: 1 }}
              />
            );
        }
      })}
    </View>
  );
}

// ---- Styles ----
const styles = StyleSheet.create({
  h1: {
    fontFamily: 'Montserrat-Bold',
    marginTop: 10,
    marginBottom: 6,
  },
  h2: {
    fontFamily: 'Montserrat-Bold',
    marginTop: 8,
    marginBottom: 4,
  },
  h3: {
    fontFamily: 'Montserrat-SemiBold',
    marginTop: 6,
    marginBottom: 3,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 3,
  },
  bulletDot: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 16,
    lineHeight: 22,
    marginRight: 8,
  },
  orderedNum: {
    fontFamily: 'Montserrat-SemiBold',
    lineHeight: 22,
    marginRight: 6,
  },
  hr: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginVertical: 10,
  },
  codeBlock: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 8,
    padding: 10,
    marginVertical: 6,
  },
  codeBlockText: {
    fontFamily: 'Montserrat-Medium',
    color: '#f0c27f',
    lineHeight: 18,
  },
});
