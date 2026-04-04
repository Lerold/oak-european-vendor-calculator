interface Props {
  name: string;
  logoUrl?: string | null;
  welcomeText?: string | null;
}

export default function VendorHeader({ name, logoUrl, welcomeText }: Props) {
  return (
    <div className="vendor-header">
      {logoUrl && (
        <img src={logoUrl} alt={name} className="vendor-logo" />
      )}
      <h2 className="vendor-name">{name}</h2>
      {welcomeText && (
        <p className="vendor-welcome">{welcomeText}</p>
      )}
    </div>
  );
}
