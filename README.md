This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

# Chain Configuration Guide

This project supports multiple chains including Celestia, Eclipse, and Forma. The chain configuration is managed through environment variables and affects various aspects of the application including UI, metadata, and chain-specific functionality.

## Available Chains

- Celestia
- Eclipse
- Forma

## Development

To run the project for a specific chain, use one of the following commands:

```bash
# For Celestia
pnpm dev:celestia

# For Eclipse
pnpm dev:eclipse

# For Forma
pnpm dev:forma
```

## Building

To build the project for a specific chain, use one of the following commands:

```bash
# For Celestia
pnpm build:celestia

# For Eclipse
pnpm build:eclipse

# For Forma
pnpm build:forma
```

## Chain-Specific Configuration

The project uses the `NEXT_PUBLIC_CHAIN` environment variable to determine the current chain. This affects:

1. **UI Elements**:
   - Favicon changes based on the chain
   - Logo changes based on the chain
   - Chain-specific CSS classes are applied to the body
   - Title and description metadata are updated

2. **Build Output**:
   - Build artifacts are stored in chain-specific directories (`out/<chain-name>`)

3. **Chain Configuration**:
   - Chain-specific wallet configurations
   - Network settings (testnet/mainnet)
   - Chain-specific features and integrations

4. **Destination Defaults**:
   - Chain-specific default assets and configurations for swaps
   - Allowed chain configurations for source and destination chains

## Implementation Details

The chain configuration is used in several key files:

- `src/app/layout.tsx`: Handles chain-specific metadata and UI elements
- `src/components/header/index.tsx`: Renders the logo based on the chain
- `src/components/app-wrapper-parent.tsx`: Manages chain-specific wallet and network configurations
- `next.config.mjs`: Configures build output directories based on the chain
- `src/components/elements-view/util.ts`: Defines chain-specific destination defaults and allowed configurations
- `src/components/elements-view/index.tsx`: Implements chain-specific swap configurations and routing

## Adding a New Chain

To add support for a new chain:

1. Add new chain-specific scripts in `package.json`:
   ```json
   "dev:newchain": "NODE_OPTIONS=\"--max-old-space-size=8192\" NEXT_PUBLIC_CHAIN=newchain next dev",
   "build:newchain": "NEXT_PUBLIC_CHAIN=newchain next build"
   ```

2. Update the chain configuration in `src/app/layout.tsx`:
   - Add favicon mapping
   - Add metadata configuration

3. Add any chain-specific configurations in `src/components/app-wrapper-parent.tsx`

4. Add chain-specific assets (favicons, logos, etc.) to the public directory

5. Configure destination defaults in `src/components/elements-view/util.ts`:
   ```typescript
   // Add to the chainDefaults object in getDestinationDefaults function
   'newchain': {
     chainId: 'your-chain-id',
     defaultAssetDenom: 'your-default-asset-denom',
     allowedChainConfig: [
       {
         chainId: 'your-chain-id',
       },
     ],
   }
   ```

   The configuration includes:
   - `chainId`: The unique identifier for your chain
   - `defaultAssetDenom`: The default asset denomination for the chain
   - `allowedChainConfig`: Array of allowed chain configurations for swaps

6. Update swap configurations in `src/components/elements-view/index.tsx` if needed:
   - Modify `allowedChainsAndAssets` prop
   - Update `allowedSourceChains` if needed
   - Adjust default values for swaps

## Environment Variables

The following environment variables are required for the application:

- `NEXT_PUBLIC_CHAIN`: Determines which chain the application is running for (e.g., 'celestia', 'eclipse', 'forma')
- `NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID`: Google OAuth client ID for social login functionality
- `NEXT_PUBLIC_TURNKEY_DEFAULT_ORG_ID`: Default organization ID for Turnkey wallet integration
- `NEXT_PUBLIC_TURNKEY_SERVER_SIGN_URL`: Server URL for Turnkey wallet signing operations
- `NEXT_PUBLIC_APP_DOMAIN`: Domain where the application is hosted, used for wallet configurations
- `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`: Project ID for WalletConnect integration
- `NEXT_PUBLIC_LEAP_API_APP_TYPE`: Whitelisted header to authorize leap api access for elements and embedded wallet sdk

To set up the environment:

1. Copy `.env.sample` to `.env.local`
2. Fill in the values for each environment variable
3. For development, you can use the default values provided in `.env.sample`
4. For production, make sure to set appropriate values for each environment variable

Note: All environment variables prefixed with `NEXT_PUBLIC_` are exposed to the browser and should not contain sensitive information.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
