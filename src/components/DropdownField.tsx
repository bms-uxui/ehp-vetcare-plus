import { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { semantic } from '../theme';
import Icon from './Icon';
import Text from './Text';

type Props = {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  placeholder?: string;
};

export default function DropdownField({
  label,
  value,
  options,
  onChange,
  placeholder,
}: Props) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const placeholderText = placeholder ?? `เลือก${label}`;
  return (
    <View style={styles.fieldWrap}>
      <Text
        variant="caption"
        style={[styles.fieldLabel, focused && { color: semantic.primary }]}
      >
        {label}
      </Text>
      <Pressable
        onPress={() => {
          setFocused(true);
          setOpen(true);
        }}
        style={[
          styles.fieldUnderline,
          focused && {
            borderBottomColor: semantic.primary,
            borderBottomWidth: 1.5,
          },
        ]}
      >
        <View style={styles.dropdownRow}>
          <Text
            variant="bodyStrong"
            style={[
              styles.fieldInput,
              !value && { color: '#9A9AA0', fontWeight: '500' },
            ]}
          >
            {value || placeholderText}
          </Text>
          <Icon
            name="ChevronDown"
            size={18}
            color="#6E6E74"
            strokeWidth={2.2}
          />
        </View>
      </Pressable>

      <Modal
        visible={open}
        presentationStyle="pageSheet"
        animationType="slide"
        onRequestClose={() => {
          setOpen(false);
          setFocused(false);
        }}
      >
        <View style={styles.dropdownSheetRoot}>
          <View style={styles.dropdownGrabber} />
          <View style={styles.dropdownHeader}>
            <Text variant="bodyStrong" style={styles.dropdownTitle}>
              {label}
            </Text>
            <Pressable
              onPress={() => {
                setOpen(false);
                setFocused(false);
              }}
              hitSlop={8}
              accessibilityLabel="ปิด"
              style={styles.dropdownCloseBtn}
            >
              <Icon name="X" size={14} color="#1A1A1A" strokeWidth={2.6} />
            </Pressable>
          </View>
          <FlatList
            data={options}
            keyExtractor={(item) => item}
            ItemSeparatorComponent={() => <View style={styles.dropdownSep} />}
            renderItem={({ item }) => {
              const selected = value === item;
              return (
                <Pressable
                  onPress={() => {
                    onChange(item);
                    setOpen(false);
                    setFocused(false);
                  }}
                  style={({ pressed }) => [
                    styles.dropdownItem,
                    pressed && { backgroundColor: '#FBF3F4' },
                  ]}
                >
                  <Text
                    variant="bodyStrong"
                    style={[
                      styles.dropdownItemText,
                      selected && { color: semantic.primary },
                    ]}
                  >
                    {item}
                  </Text>
                  {selected && (
                    <Icon
                      name="Check"
                      size={18}
                      color={semantic.primary}
                      strokeWidth={2.4}
                    />
                  )}
                </Pressable>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldWrap: { gap: 4, paddingTop: 6 },
  fieldLabel: { fontSize: 12, color: '#6E6E74', fontWeight: '500' },
  fieldUnderline: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#D0D0D4',
  },
  fieldInput: {
    fontSize: 17,
    color: '#1A1A1F',
    fontWeight: '500',
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 40,
  },
  dropdownSheetRoot: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
  },
  dropdownGrabber: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 100,
    backgroundColor: '#D0D0D4',
    marginTop: 8,
  },
  dropdownHeader: {
    height: 60,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dropdownTitle: {
    fontSize: 16,
    lineHeight: 20,
    color: '#1A1A1A',
    letterSpacing: -0.2,
  },
  dropdownCloseBtn: {
    position: 'absolute',
    right: 16,
    top: 8,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.55)',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#1A1A1F',
    fontWeight: '500',
  },
  dropdownSep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E6E6E8',
    marginHorizontal: 20,
  },
});
