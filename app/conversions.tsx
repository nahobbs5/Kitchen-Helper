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
import { ReferenceNav } from '../components/reference-nav';
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
        .map((section) => ({
          ...section,
          entries: normalizedSearch
            ? section.entries.filter((entry) =>
                `${entry.from} ${entry.to} ${entry.result}`.toLowerCase().includes(normalizedSearch)
              )
            : section.entries,
        }))
        .filter(
          (section) =>
            section.entries.length > 0 ||
            (!normalizedSearch && (activeSection === 'All' || section.title === activeSection))
        ),
    [activeSection, normalizedSearch]
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
            <ReferenceNav />
          </View>

          <View style={[styles.heroCard, { backgroundColor: palette.elevatedDark }]}>
            <Text style={[styles.heroCardLabel, { color: palette.accentSoft }]}>Chart source</Text>
            <Text style={[styles.heroCardTitle, { color: palette.inverseText }]}>
              Shamrock conversion chart references
            </Text>
            <Text style={[styles.heroCardText, { color: palette.inverseMuted }]}>
              I used the conversion chart resource as the source for these sections so the page now
              reflects your saved kitchen reference instead of a hand-made starter list.
            </Text>

            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search conversions like cup, butter, 350, or ml"
              placeholderTextColor={palette.searchPlaceholder}
              style={[
                styles.searchInput,
                { backgroundColor: palette.elevated, borderColor: palette.borderAlt, color: palette.text },
              ]}
            />

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
          </View>
        </View>

        <View style={[styles.panel, { backgroundColor: palette.elevated, borderColor: palette.border }]}>
          <Text style={[styles.panelEyebrow, { color: palette.accentText }]}>Cheat sheet</Text>
          <Text style={[styles.panelTitle, { color: palette.text }]}>
            {activeSection === 'All' ? 'Chart-based conversion sections' : activeSection}
          </Text>
          <View style={styles.listStack}>
            {visibleSections.map((section) => (
              <View
                key={section.title}
                style={[styles.detailCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}
              >
                <Text style={[styles.detailCardMeta, { color: palette.accentText }]}>{section.title}</Text>
                <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>{section.description}</Text>
                <View style={styles.conversionList}>
                  {section.entries.map((entry) => (
                    <View
                      key={`${entry.from}-${entry.result}`}
                      style={[styles.conversionRow, { backgroundColor: palette.elevatedAlt }]}
                    >
                      <Text style={[styles.conversionFrom, { color: palette.text }]}>{entry.from}</Text>
                      <Text style={[styles.conversionArrow, { color: palette.accentText }]}>to {entry.to}</Text>
                      <Text style={[styles.conversionResult, { color: palette.accent }]}>{entry.result}</Text>
                    </View>
                  ))}
                </View>
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
            The current page focuses on the most immediately useful chart sections for home cooking:
            liquid measure, dry measure, oven temperatures, butter-to-oil swaps, and common can
            sizes. If you want, we can later add more of the chart pages too, like dry spice
            conversions or ingredient yields.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
