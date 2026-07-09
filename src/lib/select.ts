interface SelectOption {
  label: string;
}

export function searchableProps(options: SelectOption[]): {
  showSearch?: boolean;
  optionFilterProp?: string;
} {
  if (options.length > 8) {
    return { showSearch: true, optionFilterProp: 'label' };
  }
  return {};
}
