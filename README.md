# Optopus

Optopus is a decentralized application (dApp) that introduces European style put and call options to crypto, using Uniswap V3 LP NFTs as collateral.

---

### Smart Contract Address

The Optopus protocol is deployed on the Base network with the following address:

**`0x757ecfd6a28a3076d4e80cdcbb29e96788d08203`**

### Clone the Repository

```bash
# Clone the repository
$ git clone https://github.com/BenAzlay/optopus-frontend.git

# Navigate to the project directory
$ cd optopus
```

### Install Dependencies

```bash
# Using npm
$ npm install

# Or using yarn
$ yarn install
```

### Environment Configuration

Create a `.env.local` file in the root directory and populate it with the required environment variables. Use `.env.example` (if available) as a reference.

### Running the Development Server

```bash
# Start the development server
$ npm run dev

# Or using yarn
$ yarn dev
```

Visit `http://localhost:3000` in your browser to see the application in action.

### Build for Production

```bash
# Build the application
$ npm run build

# Or using yarn
$ yarn build

# Start the production server
$ npm run start

# Or using yarn
$ yarn start
```

### Linting and Code Quality

To lint and check for code quality issues, run:

```bash
# Using npm
$ npm run lint

# Or using yarn
$ yarn lint
```

---

## Technology Stack

### Frontend

- **Framework**: Next.js
- **Styling**: TailwindCSS and DaisyUI
- **Web3 Interaction**: Wagmi and ethers.js
- **State Management**: Zustand
- **GraphQL**: graphql-request

### Backend

- **Smart Contract**: Solidity
- **Network**: Base (Ethereum Layer 2)
- **GraphQL Subgraph**: Custom integration

---

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

---

## Contribution

Contributions are welcome! Please follow the steps below to contribute:

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add feature description'`
4. Push to the branch: `git push origin feature-name`
5. Create a pull request.
