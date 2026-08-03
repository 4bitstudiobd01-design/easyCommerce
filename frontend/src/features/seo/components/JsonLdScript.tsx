'use client';

import React from 'react';

interface JsonLdScriptProps {
  schema: Record<string, any>;
  id?: string;
}

export const JsonLdScript: React.FC<JsonLdScriptProps> = ({ schema, id = 'jsonld-schema' }) => {
  if (!schema) return null;

  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema),
      }}
    />
  );
};
