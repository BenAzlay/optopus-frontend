import { getOptionsQuery, Option } from "@/utils/queries";
import CONSTANTS from "@/utils/constants";
import { GraphQLClient } from "graphql-request";
import { NextApiRequest, NextApiResponse } from "next";

const client = new GraphQLClient(CONSTANTS.OPTOPUS_SUBGRAPH_ENDPOINT, {
  headers: {
    Authorization: `Bearer ${process.env.REACT_APP_GRAPHQL_API_KEY}`,
  },
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const data: Option[] = await client.request(getOptionsQuery);
    res.status(200).json(data);
  } catch (error) {
    console.error("fetchOptions ERROR =>", error);
    res.status(500).json({ error: "Failed to fetch data" });
  }
}
