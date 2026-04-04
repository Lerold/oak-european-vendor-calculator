interface Country {
  code: string;
  name: string;
  flag_emoji: string;
  currency_code: string;
}

interface Props {
  countries: Country[];
  value: string;
  onChange: (code: string) => void;
  loading: boolean;
}

export default function CountrySelector({ countries, value, onChange, loading }: Props) {
  if (loading) {
    return (
      <div className="form-group">
        <label>Country</label>
        <select disabled><option>Loading countries...</option></select>
      </div>
    );
  }

  return (
    <div className="form-group">
      <label htmlFor="country">Country</label>
      <select
        id="country"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select a country</option>
        {countries.map((c) => (
          <option key={c.code} value={c.code}>
            {c.flag_emoji} {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}
