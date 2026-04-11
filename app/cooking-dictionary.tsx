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
import { useAppSettings } from '../contexts/settings-context';
import { cookingDictionaryEntries } from '../data/cooking-dictionary';

export default function CookingDictionaryScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
  const { palette } = useAppSettings();
  const [activeLetter, setActiveLetter] = useState<string>('All');
  const [searchText, setSearchText] = useState('');

  const letters = Array.from(new Set(cookingDictionaryEntries.map((entry) => entry.letter))).sort();
  const letterOptions = ['All', ...letters];
  const normalizedSearch = searchText.trim().toLowerCase();

  const visibleEntries = useMemo(
    () =>
      cookingDictionaryEntries.filter((entry) => {
        const matchesLetter = activeLetter === 'All' || entry.letter === activeLetter;
        const matchesSearch = normalizedSearch
          ? `${entry.term} ${entry.definition}`.toLowerCase().includes(normalizedSearch)
          : true;

        return matchesLetter && matchesSearch;
      }),
    [activeLetter, normalizedSearch]
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
            <Text style={[styles.title, { color: palette.text }]}>Cooking dictionary</Text>
            <Text style={[styles.subtitle, { color: palette.textMuted }]}>
              This page turns your cooking glossary resource into a searchable kitchen reference, so
              terms and techniques are easy to look up while you cook.
            </Text>
            <Text style={[styles.panelText, { color: palette.textSoft }]}>
              Source: https://whatscookingamerica.net/glossary/
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
              placeholder="Search terms like aioli, zest, braise, or vinegar"
              placeholderTextColor={palette.searchPlaceholder}
              style={[
                styles.searchInput,
                { backgroundColor: palette.elevated, borderColor: palette.borderAlt, color: palette.text },
              ]}
            />

            <View style={styles.numberGrid}>
              {letterOptions.map((letter) => {
                const isActive = activeLetter === letter;

                return (
                  <Pressable
                    key={letter}
                    onPress={() => setActiveLetter(letter)}
                    style={[
                      styles.numberButton,
                      { backgroundColor: palette.surface, borderColor: palette.borderAlt },
                      isActive && styles.numberButtonActive,
                      isActive && { backgroundColor: palette.accentSoft, borderColor: palette.accentSoft },
                    ]}
                  >
                    <Text style={[styles.numberButtonText, { color: palette.text }]}>{letter}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        <View style={[styles.panel, { backgroundColor: palette.elevated, borderColor: palette.border }]}>
          <Text style={[styles.panelEyebrow, { color: palette.accentText }]}>Glossary</Text>
          <Text style={[styles.panelTitle, { color: palette.text }]}>Cooking terms and definitions</Text>
          <View style={styles.listStack}>
            {visibleEntries.map((entry) => (
              <View
                key={entry.term}
                style={[styles.detailCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}
              >
                <Text style={[styles.detailCardMeta, { color: palette.accentText }]}>{entry.letter}</Text>
                <Text style={[styles.detailCardTitle, { color: palette.text }]}>{entry.term}</Text>
                <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>{entry.definition}</Text>
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
    </SafeAreaView>
  );
}
