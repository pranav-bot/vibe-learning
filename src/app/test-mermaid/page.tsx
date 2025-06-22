'use client';

import React from 'react';
import { MermaidDiagram } from '../learn/[contentId]/components/Diagram';

const testMermaidCode = `graph LR
    A[Data 1] --> B(Hash 1)
    C[Data 2] --> D(Hash 2)
    E[Data 3] --> F(Hash 3)
    G[Data 4] --> H(Hash 4)

    B --> I(Hash 1-2)
    D --> I
    F --> J(Hash 3-4)
    H --> J

    I --> K(Root Hash)
    J --> K

    subgraph Leaves
    A
    C
    E
    G
    end

    style A fill:#f9f,stroke:#333,stroke-width:2px
    style C fill:#f9f,stroke:#333,stroke-width:2px
    style E fill:#f9f,stroke:#333,stroke-width:2px
    style G fill:#f9f,stroke:#333,stroke-width:2px

    subgraph Hashes
    B
    D
    F
    H
    I
    J
    K
    end

    style B fill:#ccf,stroke:#333,stroke-width:2px
    style D fill:#ccf,stroke:#333,stroke-width:2px
    style F fill:#ccf,stroke:#333,stroke-width:2px
    style H fill:#ccf,stroke:#333,stroke-width:2px
    style I fill:#ccf,stroke:#333,stroke-width:2px
    style J fill:#ccf,stroke:#333,stroke-width:2px
    style K fill:#ccf,stroke:#333,stroke-width:2px

    K --> L{Verify Data 1}
    L --> M{Provide Hash 2, Hash 3-4}
    M --> N[Compute Hash 1-2]
    N --> O{Compute Root Hash'}
    O --> P{Root Hash' == Root Hash?}
    P --> Q[Data 1 is Valid]
    P --> R[Data 1 is Tampered]

    style L fill:#ffc,stroke:#333,stroke-width:2px
    style M fill:#ffc,stroke:#333,stroke-width:2px
    style N fill:#ffc,stroke:#333,stroke-width:2px
    style O fill:#ffc,stroke:#333,stroke-width:2px
    style P fill:#ffc,stroke:#333,stroke-width:2px
    style Q fill:#ccf,stroke:#333,stroke-width:2px
    style R fill:#fcc,stroke:#333,stroke-width:2px`;

export default function TestMermaidPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Mermaid Diagram Test</h1>
      <MermaidDiagram
        mermaidCode={testMermaidCode}
        title="Merkle Tree Verification"
        description="Test diagram to verify Mermaid rendering"
      />
    </div>
  );
}
