# SCL Template Update

An OpenSCD editor plugin for updating existing `LNodeType` elements in an SCL
document from IEC 61850 NSD definitions.

## Features

- Compare an existing logical node type with its NSD definition.
- Add or remove data objects and update the logical node type description.
- Highlight missing mandatory fields and empty referenced data types.
- Update a logical node type in place or replace it using swap mode.
- Remove unused supporting types when updating or deleting a logical node type.

## Installation

```sh
npm install @compas-oscd/scl-template-update
```

Register the module as an editor plugin in an OpenSCD host.
The host must provide the loaded SCL document through the plugin's `doc`
property and support the `oscd-edit-v2` event emitted by the plugin.

## Development

```sh
npm install
npm start
```

Other useful commands:

```sh
npm test       # Run the test suite with coverage
npm run lint   # Check linting and formatting
npm run build  # Create the distributable package in dist/
```

## License

Apache-2.0
