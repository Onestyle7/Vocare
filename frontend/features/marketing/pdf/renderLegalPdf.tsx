import path from 'node:path';

import { Document, Font, Page, renderToBuffer, StyleSheet, Text, View } from '@react-pdf/renderer';

import type { LegalPoint, LegalSection } from '../constants/terms-of-service';

const fontDir = path.join(process.cwd(), 'public', 'fonts', 'grotesk');

// Space Grotesk zawiera pełny zestaw polskich znaków (domyślna Helvetica w react-pdf ich nie ma)
Font.register({
  family: 'SpaceGrotesk',
  fonts: [
    { src: path.join(fontDir, 'SpaceGrotesk-Regular.ttf'), fontWeight: 400 },
    { src: path.join(fontDir, 'SpaceGrotesk-Bold.ttf'), fontWeight: 700 },
  ],
});
// Domyślne dzielenie wyrazów w react-pdf działa według reguł angielskich
Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: {
    fontFamily: 'SpaceGrotesk',
    fontSize: 9.5,
    lineHeight: 1.45,
    paddingVertical: 48,
    paddingHorizontal: 52,
    color: '#111111',
  },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 6 },
  subtitle: { fontSize: 9, color: '#555555', marginBottom: 18 },
  sectionTitle: { fontSize: 11, fontWeight: 700, marginTop: 14, marginBottom: 6 },
  row: { flexDirection: 'row', marginBottom: 4 },
  marker: { width: 18 },
  body: { flex: 1 },
  subRow: { flexDirection: 'row', marginTop: 2 },
  footer: { position: 'absolute', bottom: 24, left: 52, fontSize: 8, color: '#777777' },
});

export type LegalPdfAnnex = {
  title: string;
  intro: string;
  lines: readonly string[];
  footnote: string;
};

type LegalPdfInput = {
  title: string;
  subtitle: string;
  sections: readonly LegalSection[];
  annex?: LegalPdfAnnex;
};

const letter = (index: number) => String.fromCharCode(97 + index);

function Point({ point, marker }: { point: LegalPoint; marker: string }) {
  return (
    // Krótkie punkty trzymamy w całości na jednej stronie, długie listy (np. definicje) mogą się łamać
    <View style={styles.row} wrap={typeof point !== 'string'}>
      <Text style={styles.marker}>{marker}</Text>
      <View style={styles.body}>
        <Text>{typeof point === 'string' ? point : point.text}</Text>
        {typeof point !== 'string' &&
          point.items.map((item, index) => (
            <View key={item} style={styles.subRow} wrap={false}>
              <Text style={styles.marker}>{letter(index)})</Text>
              <Text style={styles.body}>{item}</Text>
            </View>
          ))}
      </View>
    </View>
  );
}

export function renderLegalPdf({ title, subtitle, sections, annex }: LegalPdfInput) {
  return renderToBuffer(
    <Document title={title} author="Vocare" language="pl">
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        {sections.map((section, sectionIndex) => (
          <View key={section.title}>
            <Text style={styles.sectionTitle} minPresenceAhead={40}>
              § {sectionIndex + 1}. {section.title}
            </Text>
            {section.points.map((point, pointIndex) => (
              <Point key={pointIndex} point={point} marker={`${pointIndex + 1}.`} />
            ))}
          </View>
        ))}

        {annex && (
          <View break>
            <Text style={styles.sectionTitle}>{annex.title}</Text>
            <Text style={{ marginBottom: 8 }}>{annex.intro}</Text>
            {annex.lines.map((line) => (
              <Text key={line} style={{ marginBottom: 6 }}>
                – {line}
              </Text>
            ))}
            <Text style={{ marginTop: 6 }}>{annex.footnote}</Text>
          </View>
        )}

        <Text style={styles.footer} fixed>
          vocare.pl
        </Text>
      </Page>
    </Document>
  );
}

export function pdfResponse(buffer: Buffer, fileName: string) {
  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${fileName}"`,
    },
  });
}
