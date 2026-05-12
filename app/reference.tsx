import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  PanResponder,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { ClearableSearchInput } from '../components/clearable-search-input';
import { kitchenStyles as styles } from '../components/kitchen-styles';
import { allergySubstitutions, chartSubstitutions, conversionSections } from '../components/sample-data';
import {
  alcoholDictionaryEntries,
  cheesesDictionaryEntries,
  cookingDictionaryEntries,
  generalDictionaryEntries,
  instrumentsDictionaryEntries,
  oilsDictionaryEntries,
  spicesDictionaryEntries,
} from '../data/cooking-dictionary';
import { useAppSettings } from '../contexts/settings-context';

type MainTab = 'conversions' | 'substitutions' | 'dictionary';
type SubSection = 'all' | 'allergy' | 'pantry';
type DictTab = 'all' | 'general' | 'spices' | 'oils' | 'cheeses' | 'alcohol' | 'instruments';

const BACK_TO_TOP_SCROLL_THRESHOLD = 600;

const MAIN_TABS: { key: MainTab; label: string }[] = [
  { key: 'conversions', label: 'Conversions' },
  { key: 'substitutions', label: 'Substitutions' },
  { key: 'dictionary', label: 'Dictionary' },
];

const SUB_SECTION_TABS: { key: SubSection; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'allergy', label: 'Allergy Free' },
  { key: 'pantry', label: 'General Pantry' },
];

const DICT_TABS: { key: DictTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'general', label: 'General' },
  { key: 'spices', label: 'Spices' },
  { key: 'oils', label: 'Oils' },
  { key: 'cheeses', label: 'Cheeses' },
  { key: 'alcohol', label: 'Alcohol' },
  { key: 'instruments', label: 'Instruments' },
];

const allergyTags = Array.from(new Set(allergySubstitutions.map((item) => item.allergy))).sort();
const letterOptions = ['All', ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))];
const convOptions = ['All', ...conversionSections.map((s) => s.title)];
const OVEN_TEMPERATURE_SECTION = 'Oven temperatures';
const OVEN_TEMP_MIN = 200;
const OVEN_TEMP_MAX = 550;
const OVEN_TEMP_SEARCH_INTERVAL = 25;
const OVEN_TEMP_PRESETS = [300, 325, 350, 375, 400, 425, 450];

function fahrenheitToCelsius(fahrenheit: number) {
  return Math.round((fahrenheit - 32) * 5 / 9);
}

function buildOvenTemperatureSearchText() {
  const values: string[] = [
    OVEN_TEMPERATURE_SECTION,
    'oven',
    'temperature',
    'temperatures',
    'fahrenheit',
    'farenheit',
    'celsius',
    'celcius',
    'degrees',
    'bake',
    'roast',
  ];

  for (let value = OVEN_TEMP_MIN; value <= OVEN_TEMP_MAX; value += OVEN_TEMP_SEARCH_INTERVAL) {
    values.push(`${value}`, `${value}f`, `${value} fahrenheit`);
    const celsius = fahrenheitToCelsius(value);
    values.push(`${celsius}`, `${celsius}c`, `${celsius} celsius`);
  }

  return values.join(' ').toLowerCase();
}

const ovenTemperatureSearchText = buildOvenTemperatureSearchText();

export default function ReferenceScreen() {
  const { palette } = useAppSettings();
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
  const isMobile = width < 768;
  const scrollRef = useRef<ScrollView>(null);
  const ovenSliderRef = useRef<View>(null);
  const scrollOffsetRef = useRef(0);
  const heroLayoutYRef = useRef(0);
  const heroCardLayoutYRef = useRef(0);
  const ovenSliderPageXRef = useRef(0);

  const [activeTab, setActiveTab] = useState<MainTab>('conversions');
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [searchStickyThreshold, setSearchStickyThreshold] = useState<number | null>(null);
  const [showStickySearch, setShowStickySearch] = useState(false);

  // Conversions state
  const [convSection, setConvSection] = useState('All');
  const [convSearch, setConvSearch] = useState('');
  const [ovenFahrenheit, setOvenFahrenheit] = useState(350);
  const [ovenSliderWidth, setOvenSliderWidth] = useState(0);

  // Substitutions state
  const [subSection, setSubSection] = useState<SubSection>('all');
  const [subTag, setSubTag] = useState<string | null>(null);
  const [subSearch, setSubSearch] = useState('');

  // Dictionary state
  const [dictTab, setDictTab] = useState<DictTab>('all');
  const [dictLetter, setDictLetter] = useState('All');
  const [dictSearch, setDictSearch] = useState('');

  // Conversions filtering
  const convNormalized = convSearch.trim().toLowerCase();
  const visibleConvSections = useMemo(
    () =>
      (convSection === 'All'
        ? conversionSections
        : conversionSections.filter((s) => s.title === convSection)
      )
        .map((s) => {
          const tableSearchText = s.table
            ? [
                s.title,
                s.description,
                ...s.table.columns,
                ...s.table.rows.flat(),
                s.table.note,
              ]
                .join(' ')
                .toLowerCase()
            : '';
          const tableMatchesSearch = s.table
            ? !convNormalized || tableSearchText.includes(convNormalized)
            : false;

          const ovenSectionMatchesSearch =
            s.title === OVEN_TEMPERATURE_SECTION &&
            (!convNormalized || ovenTemperatureSearchText.includes(convNormalized));

          return {
            ...s,
            entries: convNormalized
              ? ovenSectionMatchesSearch
                ? s.entries
                : s.entries.filter((e) =>
                    `${s.title} ${s.description} ${e.from} ${e.result}`
                      .toLowerCase()
                      .includes(convNormalized)
                  )
              : s.entries,
            table: tableMatchesSearch ? s.table : undefined,
          };
        })
        .filter(
          (s) =>
            s.entries.length > 0 ||
            s.table ||
            (!convNormalized && (convSection === 'All' || s.title === convSection))
        ),
    [convSection, convNormalized]
  );

  const ovenProgress = (ovenFahrenheit - OVEN_TEMP_MIN) / (OVEN_TEMP_MAX - OVEN_TEMP_MIN);
  const ovenProgressWidth = ovenSliderWidth * ovenProgress;
  const ovenCelsius = fahrenheitToCelsius(ovenFahrenheit);
  const measureOvenSlider = useCallback(() => {
    ovenSliderRef.current?.measureInWindow((x, _y, measuredWidth) => {
      ovenSliderPageXRef.current = x;
      setOvenSliderWidth(measuredWidth);
    });
  }, []);
  const setOvenTemperatureFromPageX = useCallback(
    (pageX: number) => {
      if (ovenSliderWidth <= 0) {
        return;
      }

      const boundedX = Math.max(0, Math.min(pageX - ovenSliderPageXRef.current, ovenSliderWidth));
      const rawValue = OVEN_TEMP_MIN + (boundedX / ovenSliderWidth) * (OVEN_TEMP_MAX - OVEN_TEMP_MIN);
      setOvenFahrenheit(Math.max(OVEN_TEMP_MIN, Math.min(Math.round(rawValue), OVEN_TEMP_MAX)));
    },
    [ovenSliderWidth]
  );
  const ovenSliderResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event) => {
          measureOvenSlider();
          setOvenTemperatureFromPageX(event.nativeEvent.pageX);
        },
        onPanResponderMove: (_event, gestureState) => {
          setOvenTemperatureFromPageX(gestureState.moveX);
        },
      }),
    [measureOvenSlider, setOvenTemperatureFromPageX]
  );

  // Substitutions filtering
  const subNormalized = subSearch.trim().toLowerCase();
  const showAllergy = subSection === 'all' || subSection === 'allergy';
  const showPantry = subSection === 'all' || subSection === 'pantry';

  const filteredAllergySubstitutions = useMemo(
    () =>
      allergySubstitutions.filter((item) => {
        const matchesSearch = subNormalized
          ? `${item.allergy} ${item.avoid} ${item.swap} ${item.ratio} ${item.notes}`
              .toLowerCase()
              .includes(subNormalized)
          : true;
        const matchesTag = subTag ? item.allergy === subTag : true;
        return matchesSearch && matchesTag;
      }),
    [subNormalized, subTag]
  );

  const filteredChartSubstitutions = useMemo(
    () =>
      chartSubstitutions.filter((item) =>
        subNormalized
          ? `${item.ingredient} ${item.swap} ${item.ratio} ${item.note}`
              .toLowerCase()
              .includes(subNormalized)
          : true
      ),
    [subNormalized]
  );

  // Dictionary filtering
  const dictNormalized = dictSearch.trim().toLowerCase();
  const dictSourceEntries = useMemo(() => {
    switch (dictTab) {
      case 'general': return generalDictionaryEntries;
      case 'spices': return spicesDictionaryEntries;
      case 'oils': return oilsDictionaryEntries;
      case 'cheeses': return cheesesDictionaryEntries;
      case 'alcohol': return alcoholDictionaryEntries;
      case 'instruments': return instrumentsDictionaryEntries;
      default: return cookingDictionaryEntries;
    }
  }, [dictTab]);

  const availableLetters = useMemo(
    () => new Set(dictSourceEntries.map((e) => e.letter)),
    [dictSourceEntries]
  );

  const visibleDictEntries = useMemo(
    () =>
      dictSourceEntries.filter((entry) => {
        const matchesLetter = dictLetter === 'All' || entry.letter === dictLetter;
        const matchesSearch = dictNormalized
          ? `${entry.term} ${entry.definition}`.toLowerCase().includes(dictNormalized)
          : true;
        return matchesLetter && matchesSearch;
      }),
    [dictSourceEntries, dictLetter, dictNormalized]
  );

  const groupedDictEntries = useMemo(() => {
    const groups: { letter: string; entries: typeof visibleDictEntries }[] = [];
    let current: (typeof groups)[0] | null = null;
    for (const entry of visibleDictEntries) {
      if (!current || current.letter !== entry.letter) {
        current = { letter: entry.letter, entries: [] };
        groups.push(current);
      }
      current.entries.push(entry);
    }
    return groups;
  }, [visibleDictEntries]);

  function handleBackToTop() {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  useEffect(() => {
    setSearchStickyThreshold(null);
    setShowStickySearch(false);
  }, [activeTab]);

  function updateStickySearch(offsetY: number, threshold = searchStickyThreshold) {
    if (threshold === null) {
      setShowStickySearch(false);
      return;
    }
    const shouldShow = offsetY >= threshold;
    setShowStickySearch((current) => (current === shouldShow ? current : shouldShow));
  }

  function handleInlineSearchLayout(event: LayoutChangeEvent) {
    const threshold = heroLayoutYRef.current + heroCardLayoutYRef.current + event.nativeEvent.layout.y;
    setSearchStickyThreshold(threshold);
    updateStickySearch(scrollOffsetRef.current, threshold);
  }

  function renderSearchInput(variant: 'inline' | 'sticky') {
    const inputStyle = [
      styles.searchInput,
      variant === 'sticky' && styles.referenceStickySearchInput,
      { backgroundColor: palette.elevated, borderColor: palette.borderAlt },
    ];

    return activeTab === 'conversions' ? (
      <ClearableSearchInput
        value={convSearch}
        onChangeText={setConvSearch}
        placeholder={isWide ? "Search conversions like cup, butter, 350, or ml" : "Search (cup, 350, ml…)"}
        placeholderTextColor={palette.searchPlaceholder}
        clearTintColor={palette.searchPlaceholder}
        onLayout={variant === 'inline' ? handleInlineSearchLayout : undefined}
        style={inputStyle}
        inputStyle={{ color: palette.text }}
      />
    ) : activeTab === 'substitutions' ? (
      <ClearableSearchInput
        value={subSearch}
        onChangeText={setSubSearch}
        placeholder={isWide ? "Search swaps like dairy, butter, egg, or yogurt" : "Search (dairy, egg…)"}
        placeholderTextColor={palette.searchPlaceholder}
        clearTintColor={palette.searchPlaceholder}
        onLayout={variant === 'inline' ? handleInlineSearchLayout : undefined}
        style={inputStyle}
        inputStyle={{ color: palette.text }}
      />
    ) : (
      <ClearableSearchInput
        value={dictSearch}
        onChangeText={setDictSearch}
        placeholder={isWide ? "Search terms like aioli, zest, braise, or vinegar" : "Search (aioli, zest…)"}
        placeholderTextColor={palette.searchPlaceholder}
        clearTintColor={palette.searchPlaceholder}
        onLayout={variant === 'inline' ? handleInlineSearchLayout : undefined}
        style={inputStyle}
        inputStyle={{ color: palette.text }}
      />
    );
  }

  function renderOvenTemperatureConverter() {
    return (
      <View style={[styles.ovenConverterCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}>
        <View style={styles.ovenConverterValueRow}>
          <View style={styles.ovenConverterValueBlock}>
            <Text style={[styles.detailCardMeta, { color: palette.accentText }]}>Fahrenheit</Text>
            <Text style={[styles.ovenConverterValue, { color: palette.text }]}>{ovenFahrenheit}F</Text>
          </View>
          <View style={styles.ovenConverterValueBlock}>
            <Text style={[styles.detailCardMeta, { color: palette.accentText }]}>Celsius</Text>
            <Text style={[styles.ovenConverterValue, { color: palette.text }]}>{ovenCelsius}C</Text>
          </View>
        </View>

        <View
          ref={ovenSliderRef}
          onLayout={(event) => {
            setOvenSliderWidth(event.nativeEvent.layout.width);
            measureOvenSlider();
          }}
          style={styles.ovenSliderHitArea}
          {...ovenSliderResponder.panHandlers}
        >
          <View style={[styles.ovenSliderTrack, { backgroundColor: palette.borderAlt }]}>
            <View
              style={[
                styles.ovenSliderFill,
                { backgroundColor: palette.accentSoft, width: ovenProgressWidth },
              ]}
            />
            <View
              style={[
                styles.ovenSliderThumb,
                {
                  backgroundColor: palette.accent,
                  borderColor: palette.surface,
                  left: ovenProgressWidth,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.ovenSliderRangeRow}>
          <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>{OVEN_TEMP_MIN}F</Text>
          <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>{OVEN_TEMP_MAX}F</Text>
        </View>

        <View style={styles.ovenPresetRow}>
          {OVEN_TEMP_PRESETS.map((preset) => {
            const isActive = preset === ovenFahrenheit;

            return (
              <Pressable
                key={preset}
                onPress={() => setOvenFahrenheit(preset)}
                style={[
                  styles.ovenPresetButton,
                  { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt },
                  isActive && { backgroundColor: palette.accentSoft, borderColor: palette.accentSoft },
                ]}
              >
                <Text style={[styles.ovenPresetButtonText, { color: palette.text }]}>{preset}F</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.page,
          isMobile && activeTab === 'dictionary' && styles.dictionaryPageWithBackToTop,
        ]}
        onScroll={(event) => {
          const offsetY = event.nativeEvent.contentOffset.y;
          scrollOffsetRef.current = offsetY;
          const shouldShowBackToTop = offsetY > BACK_TO_TOP_SCROLL_THRESHOLD;
          setShowBackToTop((current) => (current === shouldShowBackToTop ? current : shouldShowBackToTop));
          updateStickySearch(offsetY);
        }}
        scrollEventThrottle={16}
      >
        <View
          onLayout={(event) => {
            heroLayoutYRef.current = event.nativeEvent.layout.y;
          }}
          style={[
            styles.hero,
            isWide && styles.heroWide,
            { backgroundColor: palette.surface, borderColor: palette.borderAlt },
          ]}
        >
          <View style={styles.heroCopy}>
            <Text style={[styles.title, { color: palette.text }]}>Kitchen Guides</Text>
            <View style={styles.numberGrid}>
              {MAIN_TABS.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <Pressable
                    key={tab.key}
                    onPress={() => setActiveTab(tab.key)}
                    style={[
                      styles.numberButton,
                      { backgroundColor: palette.elevated, borderColor: palette.borderAlt },
                      isActive && { backgroundColor: palette.accentSoft, borderColor: palette.accentSoft },
                    ]}
                  >
                    <Text style={[styles.numberButtonText, { color: palette.text }]}>{tab.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View
            onLayout={(event) => {
              heroCardLayoutYRef.current = event.nativeEvent.layout.y;
            }}
            style={[styles.heroCard, { backgroundColor: palette.elevatedDark }]}
          >
            {activeTab === 'conversions' && (
              <>
                <Text style={[styles.heroCardLabel, { color: palette.accentSoft }]}>Conversions</Text>
                {renderSearchInput('inline')}
                <View style={styles.numberGrid}>
                  {convOptions.map((opt) => {
                    const isActive = convSection === opt;
                    return (
                      <Pressable
                        key={opt}
                        onPress={() => setConvSection(opt)}
                        style={[
                          styles.numberButton,
                          { backgroundColor: palette.surface, borderColor: palette.borderAlt },
                          isActive && { backgroundColor: palette.accentSoft, borderColor: palette.accentSoft },
                        ]}
                      >
                        <Text style={[styles.numberButtonText, { color: palette.text }]}>{opt}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}

            {activeTab === 'substitutions' && (
              <>
                <Text style={[styles.heroCardLabel, { color: palette.accentSoft }]}>Substitutions</Text>
                {renderSearchInput('inline')}
                <View style={styles.numberGrid}>
                  {SUB_SECTION_TABS.map((tab) => {
                    const isActive = subSection === tab.key;
                    return (
                      <Pressable
                        key={tab.key}
                        onPress={() => {
                          setSubSection(tab.key);
                          setSubTag(null);
                          setSubSearch('');
                        }}
                        style={[
                          styles.numberButton,
                          { backgroundColor: palette.surface, borderColor: palette.borderAlt },
                          isActive && { backgroundColor: palette.accentSoft, borderColor: palette.accentSoft },
                        ]}
                      >
                        <Text style={[styles.numberButtonText, { color: palette.text }]}>{tab.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                {showAllergy ? (
                  <View style={styles.numberGrid}>
                    {allergyTags.map((tag) => {
                      const isActive = subTag === tag;
                      return (
                        <Pressable
                          key={tag}
                          onPress={() => setSubTag((prev) => (prev === tag ? null : tag))}
                          style={[
                            styles.numberButton,
                            { backgroundColor: palette.surface, borderColor: palette.borderAlt },
                            isActive && { backgroundColor: palette.accentSoft, borderColor: palette.accentSoft },
                          ]}
                        >
                          <Text style={[styles.numberButtonText, { color: palette.text }]}>{tag}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}
              </>
            )}

            {activeTab === 'dictionary' && (
              <>
                <Text style={[styles.heroCardLabel, { color: palette.accentSoft }]}>Dictionary</Text>
                <Text style={[styles.heroCardTitle, { color: palette.inverseText }]}>
                  {visibleDictEntries.length} terms shown
                </Text>
                {renderSearchInput('inline')}
                <View style={styles.numberGrid}>
                  {DICT_TABS.map((tab) => {
                    const isActive = dictTab === tab.key;
                    return (
                      <Pressable
                        key={tab.key}
                        onPress={() => {
                          setDictTab(tab.key);
                          setDictLetter('All');
                          setDictSearch('');
                        }}
                        style={[
                          styles.numberButton,
                          { backgroundColor: palette.surface, borderColor: palette.borderAlt },
                          isActive && { backgroundColor: palette.accentSoft, borderColor: palette.accentSoft },
                        ]}
                      >
                        <Text style={[styles.numberButtonText, { color: palette.text }]}>{tab.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                <View style={styles.numberGrid}>
                  {letterOptions.map((letter) => {
                    const isActive = dictLetter === letter;
                    const isAvailable = letter === 'All' || availableLetters.has(letter);
                    return (
                      <Pressable
                        key={letter}
                        onPress={() => isAvailable && setDictLetter(letter)}
                        disabled={!isAvailable}
                        style={[
                          styles.numberButton,
                          { backgroundColor: palette.surface, borderColor: palette.borderAlt },
                          !isAvailable && styles.numberButtonDisabled,
                          !isAvailable && { backgroundColor: palette.elevated, borderColor: palette.border },
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
              </>
            )}
          </View>
        </View>

        {activeTab === 'conversions' && (
          <View style={[styles.panel, { backgroundColor: palette.elevated, borderColor: palette.border }]}>
            <Text style={[styles.panelTitle, { color: palette.text }]}>
              {convSection === 'All' ? 'All conversion sections' : convSection}
            </Text>
            <View style={styles.listStack}>
              {visibleConvSections.map((section) => (
                <View key={section.title} style={{ gap: 14 }}>
                  {convSection === 'All' ? (
                    <Text style={[styles.panelEyebrow, { color: palette.accentText, marginTop: 8, marginBottom: 4 }]}>
                      {section.title}
                    </Text>
                  ) : null}
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
                              numberOfLines={1}
                              adjustsFontSizeToFit
                              minimumFontScale={0.82}
                              maxFontSizeMultiplier={1.1}
                              style={[
                                styles.conversionTableCell,
                                index === 0 && styles.conversionTableAmountCell,
                                index > 0 &&
                                  index < section.table!.columns.length - 1 &&
                                  styles.conversionTableShortCell,
                                index === section.table!.columns.length - 1 && styles.conversionTableGramsCell,
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
                                numberOfLines={1}
                                adjustsFontSizeToFit
                                minimumFontScale={0.82}
                                maxFontSizeMultiplier={1.1}
                                style={[
                                  styles.conversionTableCell,
                                  index === 0 && styles.conversionTableAmountCell,
                                  index > 0 && index < row.length - 1 && styles.conversionTableShortCell,
                                  index === row.length - 1 && styles.conversionTableGramsCell,
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
                  {section.title === OVEN_TEMPERATURE_SECTION
                    ? renderOvenTemperatureConverter()
                    : section.entries.map((entry) => (
                        <View
                          key={`${section.title}-${entry.from}-${entry.result}`}
                          style={[
                            styles.detailCard,
                            { backgroundColor: palette.surface, borderColor: palette.borderAlt },
                          ]}
                        >
                          <Text style={[styles.detailCardTitle, { color: palette.text }]}>{entry.from}</Text>
                          <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>{entry.result}</Text>
                        </View>
                      ))}
                </View>
              ))}
              {visibleConvSections.length === 0 ? (
                <View style={[styles.detailCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}>
                  <Text style={[styles.detailCardTitle, { color: palette.text }]}>No conversion results found</Text>
                  <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>
                    Try another search term or switch back to All.
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        )}

        {activeTab === 'substitutions' && showAllergy ? (
          <View style={[styles.panel, { backgroundColor: palette.elevated, borderColor: palette.border }]}>
            <Text style={[styles.panelTitle, { color: palette.text }]}>
              {subTag ? `${subTag} substitutions` : 'Allergy substitutions'}
            </Text>
            <View style={styles.listStack}>
              {filteredAllergySubstitutions.map((item) => (
                <View
                  key={`${item.allergy}-${item.avoid}`}
                  style={[styles.detailCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}
                >
                  <Text style={[styles.detailCardMeta, { color: palette.accentText }]}>{item.allergy}</Text>
                  <Text style={[styles.detailCardTitle, { color: palette.text }]}>{`${item.avoid} → ${item.swap}`}</Text>
                  {item.ratio !== '1 egg replacement' ? (
                    <Text style={[styles.infoCardMeta, { color: palette.text, fontSize: 22 }]}>{item.ratio}</Text>
                  ) : null}
                  <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>{item.notes}</Text>
                </View>
              ))}
              {filteredAllergySubstitutions.length === 0 ? (
                <View style={[styles.detailCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}>
                  <Text style={[styles.detailCardTitle, { color: palette.text }]}>No allergy swap matches</Text>
                  <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>
                    Try another search term or tag.
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        {activeTab === 'substitutions' && showPantry ? (
          <View style={[styles.panelAlt, { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt }]}>
            <Text style={[styles.panelTitle, { color: palette.text }]}>General pantry substitutions</Text>
            <View style={styles.cardStack}>
              {filteredChartSubstitutions.map((item) => (
                <View
                  key={item.ingredient}
                  style={[styles.infoCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}
                >
                  <Text style={[styles.infoCardTitle, { color: palette.accentText }]}>{item.ingredient}</Text>
                  <Text style={[styles.infoCardSwap, { color: palette.text }]}>{item.swap}</Text>
                  <Text style={[styles.infoCardMeta, { color: palette.text, fontSize: 22 }]}>{item.ratio}</Text>
                  <Text style={[styles.infoCardBody, { color: palette.textMuted }]}>{item.note}</Text>
                </View>
              ))}
              {filteredChartSubstitutions.length === 0 ? (
                <View style={[styles.detailCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}>
                  <Text style={[styles.detailCardTitle, { color: palette.text }]}>No pantry substitution matches</Text>
                  <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>Try another search term.</Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        {activeTab === 'dictionary' && (
          <View style={[styles.panel, { backgroundColor: palette.elevated, borderColor: palette.border }]}>
            <Text style={[styles.panelTitle, { color: palette.text }]}>
              {dictTab === 'all' ? 'All Entries' : DICT_TABS.find((t) => t.key === dictTab)?.label ?? ''}
            </Text>
            <View style={styles.listStack}>
              {groupedDictEntries.map((group) => (
                <View key={`${dictTab}-${group.letter}`} style={{ gap: 14 }}>
                  <Text style={[styles.panelEyebrow, { color: palette.accentText, marginTop: 8, marginBottom: 4 }]}>
                    {group.letter}
                  </Text>
                  {group.entries.map((entry) => (
                    <View
                      key={`${dictTab}-${entry.term}`}
                      style={[styles.detailCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}
                    >
                      <Text style={[styles.detailCardTitle, { color: palette.text }]}>{entry.term}</Text>
                      <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>{entry.definition}</Text>
                    </View>
                  ))}
                </View>
              ))}
              {visibleDictEntries.length === 0 ? (
                <View style={[styles.detailCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}>
                  <Text style={[styles.detailCardTitle, { color: palette.text }]}>No dictionary matches found</Text>
                  <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>
                    Try another search term or switch back to All.
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        )}
      </ScrollView>
      {showStickySearch ? (
        <View
          style={[
            styles.referenceStickySearch,
            isWide && styles.referenceStickySearchWide,
            { backgroundColor: palette.background, borderColor: palette.borderAlt },
          ]}
        >
          {renderSearchInput('sticky')}
        </View>
      ) : null}
      {isMobile && activeTab === 'dictionary' && showBackToTop ? (
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
