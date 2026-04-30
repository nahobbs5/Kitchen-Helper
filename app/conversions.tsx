import { useMemo, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { kitchenStyles as styles } from '../components/kitchen-styles';
import { conversionSections } from '../components/sample-data';
import { useAppSettings } from '../contexts/settings-context';

export default function ConversionsScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
  const { palette } = useAppSettings();
  const [activeSection, setActiveSection] = useState<string>('All');
  const [searchText, setSearchText] = useState('');

  const sectionOptions = ['All', ...conversionSections.map((section) => section.title)];
  const normalizedSearch = searchText.trim().toLowerCase();
  const visibleSections = useMemo(
    () =>
      (activeSection === 'All'
        ? conversionSections
        : conversionSections.filter((section) => section.title === activeSection))
        .map((section) => {
          const tableSearchText = section.table
            ? [
                section.title,
                section.description,
                ...section.table.columns,
                ...section.table.rows.flat(),
                section.table.note,
              ]
                .join(' ')
                .toLowerCase()
            : '';
          const tableMatchesSearch = section.table
            ? !normalizedSearch || tableSearchText.includes(normalizedSearch)
            : false;

          return {
            ...section,
            entries: normalizedSearch
              ? section.entries.filter((entry) =>
                  `${section.title} ${section.description} ${entry.from} ${entry.result}`
                    .toLowerCase()
                    .includes(normalizedSearch)
                )
              : section.entries,
            table: tableMatchesSearch ? section.table : undefined,
          };
        })
        .filter(
          (section) =>
            section.entries.length > 0 ||
            section.table ||
            (!normalizedSearch && (activeSection === 'All' || section.title === activeSection))
        ),
    [activeSection, normalizedSearch]
  );
  const visibleConversionCount = visibleSections.reduce(
    (total, section) => total + section.entries.length + (section.table?.rows.length ?? 0),
    0
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}>
      <ScrollView contentContainerStyle={styles.page}>
        <View
          style={[
            styles.hero,
            isWide && styles.heroWide,
            { backgroundColor: palette.surface, borderColor: palette.borderAlt },
          ]}
        >
          <View style={styles.heroCopy}>
            <Text style={[styles.eyebrow, { color: palette.accentText }]}>Reference page</Text>
            <Text style={[styles.title, { color: palette.text }]}>Common cooking conversions</Text>
            <Text style={[styles.subtitle, { color: palette.textMuted }]}>
              This page now pulls from the conversion chart you added to the Obsidian resources
              folder. It is meant to work like a quick kitchen reference people can reopen while
              cooking or baking.
            </Text>
          </View>

          <View style={[styles.heroCard, { backgroundColor: palette.elevatedDark }]}>
            <Text style={[styles.heroCardLabel, { color: palette.accentSoft }]}>Conversion search</Text>
            <Text style={[styles.heroCardTitle, { color: palette.inverseText }]}>
              {visibleConversionCount} conversions shown
            </Text>
            <Text style={[styles.heroCardText, { color: palette.inverseMuted }]}>
              Search by measure, swap, oven temperature, or can size, or jump straight to the
              section you need.
            </Text>

            <View style={styles.numberGrid}>
              {sectionOptions.map((option) => {
                const isActive = activeSection === option;

                return (
                  <Pressable
                    key={option}
                    onPress={() => setActiveSection(option)}
                    style={[
                      styles.numberButton,
                      {
                        backgroundColor: palette.surface,
                        borderColor: palette.borderAlt,
                      },
                      isActive && styles.numberButtonActive,
                      isActive && { backgroundColor: palette.accentSoft, borderColor: palette.accentSoft },
                    ]}
                  >
                    <Text style={[styles.numberButtonText, { color: palette.text }]}>{option}</Text>
                  </Pressable>
                );
              })}
            </View>

            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder={isWide ? "Search conversions like cup, butter, 350, or ml" : "Search (cup, 350, ml…)"}
              placeholderTextColor={palette.searchPlaceholder}
              style={[
                styles.searchInput,
                { backgroundColor: palette.elevated, borderColor: palette.borderAlt, color: palette.text },
              ]}
            />
          </View>
        </View>

        <View style={[styles.panel, { backgroundColor: palette.elevated, borderColor: palette.border }]}>
          <Text style={[styles.panelEyebrow, { color: palette.accentText }]}>Cheat sheet</Text>
          <Text style={[styles.panelTitle, { color: palette.text }]}>
            {activeSection === 'All' ? 'Chart-based conversion sections' : activeSection}
          </Text>
          <View style={styles.listStack}>
            {visibleSections.map((section) => (
              <View key={section.title} style={{ gap: 14 }}>
                <Text
                  style={[
                    styles.panelEyebrow,
                    { color: palette.accentText, marginTop: 8, marginBottom: 4 },
                  ]}
                >
                  {section.title}
                </Text>
                {section.table ? (
                  <View
                    style={[
                      styles.detailCard,
                      { backgroundColor: palette.surface, borderColor: palette.borderAlt },
                    ]}
                  >
                    <View style={styles.conversionTable}>
                      <View style={[styles.conversionTableRow, styles.conversionTableHeader]}>
                        {section.table.columns.map((column, index) => (
                          <Text
                            key={column}
                            style={[
                              styles.conversionTableCell,
                              index === 0 && styles.conversionTableAmountCell,
                              styles.conversionTableHeaderCell,
                              { color: palette.accentText },
                            ]}
                          >
                            {column}
                          </Text>
                        ))}
                      </View>
                      {section.table.rows.map((row) => (
                        <View key={row.join('-')} style={styles.conversionTableRow}>
                          {row.map((cell, index) => (
                            <Text
                              key={`${row[0]}-${index}`}
                              style={[
                                styles.conversionTableCell,
                                index === 0 && styles.conversionTableAmountCell,
                                { color: index === 0 ? palette.text : palette.textMuted },
                              ]}
                            >
                              {cell}
                            </Text>
                          ))}
                        </View>
                      ))}
                    </View>
                    <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>
                      {section.table.note}
                    </Text>
                  </View>
                ) : null}
                {section.entries.map((entry) => (
                  <View
                    key={`${section.title}-${entry.from}-${entry.result}`}
                    style={[styles.detailCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}
                  >
                    <Text style={[styles.detailCardTitle, { color: palette.text }]}>{entry.from}</Text>
                    <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>{entry.result}</Text>
                  </View>
                ))}
              </View>
            ))}
            {visibleSections.length === 0 ? (
              <View style={[styles.detailCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}>
                <Text style={[styles.detailCardTitle, { color: palette.text }]}>No conversion results found</Text>
                <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>
                  Try another search term or switch back to `All`.
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={[styles.panelAlt, { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt }]}>
          <Text style={[styles.panelEyebrow, { color: palette.accentText }]}>What came from the chart</Text>
          <Text style={[styles.panelText, { color: palette.textMuted }]}>
            These references come from the conversion chart resource and focus on the sections most
            useful during everyday cooking: liquid measure, dry measure, oven temperatures,
            butter-to-oil swaps, and common can sizes.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
