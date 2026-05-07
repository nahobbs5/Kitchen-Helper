import { useMemo, useRef, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { kitchenStyles as styles } from '../components/kitchen-styles';
import { useAppSettings } from '../contexts/settings-context';
import {
  alcoholDictionaryEntries,
  cookingDictionaryEntries,
  generalDictionaryEntries,
  instrumentsDictionaryEntries,
  oilsDictionaryEntries,
  spicesDictionaryEntries,
} from '../data/cooking-dictionary';

type TabKey = 'all' | 'general' | 'spices' | 'oils' | 'alcohol' | 'instruments';

const BACK_TO_TOP_SCROLL_THRESHOLD = 600;

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'general', label: 'General' },
  { key: 'spices', label: 'Spices' },
  { key: 'oils', label: 'Oils' },
  { key: 'alcohol', label: 'Alcohol' },
  { key: 'instruments', label: 'Instruments' },
];

const TAB_LABELS: Record<TabKey, string> = {
  all: 'All Entries',
  general: 'General cooking terms',
  spices: 'Spices and seasonings',
  oils: 'Cooking oils and fats',
  alcohol: 'Alcohol and mixed drinks',
  instruments: 'Cooking instruments and utensils',
};

export default function CookingDictionaryScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
  const isMobile = width < 768;
  const { palette } = useAppSettings();
  const scrollRef = useRef<ScrollView>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [activeLetter, setActiveLetter] = useState<string>('All');
  const [searchText, setSearchText] = useState('');
  const [showBackToTop, setShowBackToTop] = useState(false);

  const sourceEntries = useMemo(() => {
    switch (activeTab) {
      case 'general': return generalDictionaryEntries;
      case 'spices': return spicesDictionaryEntries;
      case 'oils': return oilsDictionaryEntries;
      case 'alcohol': return alcoholDictionaryEntries;
      case 'instruments': return instrumentsDictionaryEntries;
      default: return cookingDictionaryEntries;
    }
  }, [activeTab]);

  const availableLetters = useMemo(
    () => new Set(sourceEntries.map((entry) => entry.letter)),
    [sourceEntries]
  );

  const letterOptions = [
    'All',
    ...Array.from({ length: 26 }, (_, index) => String.fromCharCode(65 + index)),
  ];
  const normalizedSearch = searchText.trim().toLowerCase();
  const visibleEntries = useMemo(
    () =>
      sourceEntries.filter((entry) => {
        const matchesLetter = activeLetter === 'All' || entry.letter === activeLetter;
        const matchesSearch = normalizedSearch
          ? `${entry.term} ${entry.definition}`.toLowerCase().includes(normalizedSearch)
          : true;

        return matchesLetter && matchesSearch;
      }),
    [sourceEntries, activeLetter, normalizedSearch]
  );

  const groupedEntries = useMemo(() => {
    const groups: { letter: string; entries: typeof visibleEntries }[] = [];
    let current: (typeof groups)[0] | null = null;
    for (const entry of visibleEntries) {
      if (!current || current.letter !== entry.letter) {
        current = { letter: entry.letter, entries: [] };
        groups.push(current);
      }
      current.entries.push(entry);
    }
    return groups;
  }, [visibleEntries]);

  function handleTabChange(tab: TabKey) {
    setActiveTab(tab);
    setActiveLetter('All');
    setSearchText('');
  }

  function handleBackToTop() {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  const categoryTabs = (
    <View style={styles.numberGrid}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <Pressable
            key={tab.key}
            onPress={() => handleTabChange(tab.key)}
            style={[
              styles.numberButton,
              { backgroundColor: palette.surface, borderColor: palette.borderAlt },
              isActive && styles.numberButtonActive,
              isActive && { backgroundColor: palette.accentSoft, borderColor: palette.accentSoft },
            ]}
          >
            <Text style={[styles.numberButtonText, { color: palette.text }]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.page, isMobile && styles.dictionaryPageWithBackToTop]}
        onScroll={(event) => {
          const shouldShow = event.nativeEvent.contentOffset.y > BACK_TO_TOP_SCROLL_THRESHOLD;
          setShowBackToTop((current) => (current === shouldShow ? current : shouldShow));
        }}
        scrollEventThrottle={16}
      >
        <View
          style={[
            styles.hero,
            isWide && styles.heroWide,
            { backgroundColor: palette.surface, borderColor: palette.borderAlt },
          ]}
        >
          <View style={styles.heroCopy}>
            <Text style={[styles.eyebrow, { color: palette.accentText }]}>Reference page</Text>
            <Text style={[styles.title, { color: palette.text }]}>Cooking dictionary</Text>
            <Text style={[styles.subtitle, { color: palette.textMuted }]}>
              This page turns your custom cooking glossary into a searchable kitchen reference, so
              terms and techniques are easy to look up while you cook.
            </Text>
          </View>

          <View style={[styles.heroCard, { backgroundColor: palette.elevatedDark }]}>
            <Text style={[styles.heroCardLabel, { color: palette.accentSoft }]}>Dictionary search</Text>
            <Text style={[styles.heroCardTitle, { color: palette.inverseText }]}>
              {visibleEntries.length} terms shown
            </Text>
            <Text style={[styles.heroCardText, { color: palette.inverseMuted }]}>
              Search by term or definition, or jump to a letter when you know what you are looking
              for.
            </Text>

            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder={isWide ? "Search terms like aioli, zest, braise, or vinegar" : "Search (aioli, zest…)"}
              placeholderTextColor={palette.searchPlaceholder}
              style={[
                styles.searchInput,
                { backgroundColor: palette.elevated, borderColor: palette.borderAlt, color: palette.text },
              ]}
            />

            <View style={styles.numberGrid}>
              {letterOptions.map((letter) => {
                const isActive = activeLetter === letter;
                const isAvailable = letter === 'All' || availableLetters.has(letter);

                return (
                  <Pressable
                    key={letter}
                    onPress={() => {
                      if (!isAvailable) {
                        return;
                      }

                      setActiveLetter(letter);
                    }}
                    disabled={!isAvailable}
                    style={[
                      styles.numberButton,
                      { backgroundColor: palette.surface, borderColor: palette.borderAlt },
                      !isAvailable && styles.numberButtonDisabled,
                      !isAvailable && { backgroundColor: palette.elevated, borderColor: palette.border },
                      isActive && styles.numberButtonActive,
                      isActive && { backgroundColor: palette.accentSoft, borderColor: palette.accentSoft },
                    ]}
                  >
                    <Text
                      style={[
                        styles.numberButtonText,
                        { color: isAvailable ? palette.text : palette.textSoft },
                      ]}
                    >
                      {letter}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        <View style={[styles.panel, { backgroundColor: palette.elevated, borderColor: palette.border }]}>
          {categoryTabs}
          <Text style={[styles.panelTitle, { color: palette.text }]}>{TAB_LABELS[activeTab]}</Text>
          <View style={styles.listStack}>
            {groupedEntries.map((group) => (
              <View key={`${activeTab}-${group.letter}`} style={{ gap: 14 }}>
                <Text
                  style={[
                    styles.panelEyebrow,
                    { color: palette.accentText, marginTop: 8, marginBottom: 4 },
                  ]}
                >
                  {group.letter}
                </Text>
                {group.entries.map((entry, index) => (
                  <View
                    key={`${activeTab}-${group.letter}-${entry.term}-${index}`}
                    style={[styles.detailCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}
                  >
                    <Text style={[styles.detailCardTitle, { color: palette.text }]}>{entry.term}</Text>
                    <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>{entry.definition}</Text>
                  </View>
                ))}
              </View>
            ))}
            {visibleEntries.length === 0 ? (
              <View style={[styles.detailCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}>
                <Text style={[styles.detailCardTitle, { color: palette.text }]}>No dictionary matches found</Text>
                <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>
                  Try another search term or switch back to `All`.
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>
      {isMobile && showBackToTop ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to top"
          onPress={handleBackToTop}
          style={[
            styles.dictionaryBackToTopButton,
            { backgroundColor: palette.elevated, borderColor: palette.borderAlt },
          ]}
        >
          <ChevronUpIcon color={palette.accent} />
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
}

function ChevronUpIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 14L12 8L18 14"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
