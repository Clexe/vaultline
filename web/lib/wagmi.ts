import { createConfig, http } from "wagmi";
import { monad } from "wagmi/chains";
import { injected } from "wagmi/connectors";

export const wagmiConfig = createConfig({
  chains: [monad],
  connectors: [injected()],
  transports: {
    [monad.id]: http("https://rpc.monad.xyz"),
  },
  ssr: true,
});
