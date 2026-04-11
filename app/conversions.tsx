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

export default function ConversionsScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={[styles.hero, isWide && styles.heroWide]}>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>Reference page</Text>
            <Text style={styles.title}>Common cooking conversions</Text>
            <Text style={styles.subtitle}>
              This page now pulls from the conversion chart you added to the Obsidian resources
              folder. It is meant to work like a quick kitchen reference people can reopen while
              cooking or baking.
            </Text>
          </View>

          <View style={styles.heroCard}>
            <Text style={styles.heroCardLabel}>Chart source</Text>
            <Text style={styles.heroCardTitle}>Shamrock conversion chart references</Text>
            <Text style={styles.heroCardText}>
              I used the conversion chart resource as the source for these sections so the page now
              reflects your saved kitchen reference instead of a hand-made starter list.
            </Text>

            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search conversions like cup, butter, 350, or ml"
              placeholderTextColor="#8f775b"
              style={styles.searchInput}
            />

            <View style={styles.numberGrid}>
              {sectionOptions.map((option) => {
                const isActive = activeSection === option;

                return (
                  <Pressable
                    key={option}
                    onPress={() => setActiveSection(option)}
                    style={[styles.numberButton, isActive && styles.numberButtonActive]}
                  >
                    <Text style={styles.numberButtonText}>{option}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelEyebrow}>Cheat sheet</Text>
          <Text style={styles.panelTitle}>
            {activeSection === 'All' ? 'Chart-based conversion sections' : activeSection}
          </Text>
          <View style={styles.listStack}>
            {visibleSections.map((section) => (
              <View key={section.title} style={styles.detailCard}>
                <Text style={styles.detailCardMeta}>{section.title}</Text>
                <Text style={styles.detailCardBody}>{section.description}</Text>
                <View style={styles.conversionList}>
                  {section.entries.map((entry) => (
                    <View key={`${entry.from}-${entry.result}`} style={styles.conversionRow}>
                      <Text style={styles.conversionFrom}>{entry.from}</Text>
                      <Text style={styles.conversionArrow}>to {entry.to}</Text>
                      <Text style={styles.conversionResult}>{entry.result}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
            {visibleSections.length === 0 ? (
              <View style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>No conversion results found</Text>
                <Text style={styles.detailCardBody}>
                  Try another search term or switch back to `All`.
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.panelAlt}>
          <Text style={styles.panelEyebrow}>What came from the chart</Text>
          <Text style={styles.panelText}>
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
