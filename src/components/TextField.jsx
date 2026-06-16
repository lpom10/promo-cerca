const TextField = ({ label, name, value, onChange, placeholder, type = "text", error, required = false }) => {
  return (
    <div className="auth-field">
      {label && (
        <label className="auth-label">
          {label} {required && <span className="required-tag" style={{color: 'red', fontSize: '10px', marginLeft: '5px'}}>*</span>}
        </label>
      )}
      <input
        className={`auth-input ${error ? 'is-error' : ''}`}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: error ? '1px solid red' : '1px solid #ddd' }}
      />
      {error && <span className="auth-field-error" style={{color: 'red', fontSize: '12px'}}>{error}</span>}
    </div>
  );
};

export default TextField;
