import React from 'react';

// Simple Icon component for Material Icons
const Icon = ({ name, style }) => (
  <span className="material-icons-outlined" style={style}>
    {name}
  </span>
);

export default Icon; 