/**
 * DS shell colours. `id` matches a `.ds[data-color]` block in ds.css (midnight is the
 * default in base.css); `body` / `hi` only colour the swatch.
 */
export const DS_COLORS = [
  { id: 'midnight', label: 'Midnight Blue', body: '#2f5fae', hi: '#4a7cc8' },
  { id: 'ice', label: 'Ice Blue', body: '#59c2db', hi: '#7fd3e8' },
  { id: 'crimson', label: 'Crimson', body: '#c8323a', hi: '#e05a60' },
  { id: 'pink', label: 'Pink', body: '#ec8db4', hi: '#f6b1cd' },
  { id: 'emerald', label: 'Emerald', body: '#2f9e68', hi: '#4fbb84' },
  { id: 'white', label: 'Polar White', body: '#e9ecee', hi: '#ffffff' },
  { id: 'onyx', label: 'Onyx Black', body: '#2c2f33', hi: '#45494e' },
];

export default function ColorPicker({ value, onChange }) {
  return (
    <div className="color-picker" role="group" aria-label="DS colour">
      <span>DS COLOUR</span>
      {DS_COLORS.map((c) => (
        <button
          key={c.id}
          className="color-picker__swatch"
          style={{ '--body': c.body, '--hi': c.hi }}
          aria-label={c.label}
          aria-pressed={value === c.id}
          title={c.label}
          onClick={() => onChange(c.id)}
        />
      ))}
    </div>
  );
}
