const API_VERSION = '2026-01';

export class ShopifyClient {
  private shop: string;
  private accessToken: string;

  constructor(shop: string, accessToken: string) {
    this.shop = shop.includes(".myshopify.com") ? shop : `${shop}.myshopify.com`;
    this.accessToken = accessToken;
  }

  /**
   * GraphQL Request (Primary for 2026-01)
   */
  async graphql(query: string, variables: any = {}) {
    const response = await fetch(`https://${this.shop}/admin/api/${API_VERSION}/graphql.json`, {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": this.accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Shopify GraphQL Error: ${error}`);
    }

    const data = await response.json();
    if (data.errors) {
      console.error('🛑 [Shopify GraphQL Errors]', data.errors);
      throw new Error(`Shopify GraphQL Error: ${JSON.stringify(data.errors)}`);
    }
    return data.data;
  }

  /**
   * REST Request (Only for webhooks/legacy tasks)
   */
  async rest(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`https://${this.shop}/admin/api/${API_VERSION}/${endpoint}`, {
      ...options,
      headers: {
        "X-Shopify-Access-Token": this.accessToken,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Shopify REST Error: ${JSON.stringify(error)}`);
    }

    return response.json();
  }

  // ─── PRODUCT & CATALOG ─────────────────────────────────────

  /**
   * EXTRAER PRODUCTO DESDE URL (URL-to-Everything)
   */
  async getProductByHandle(handle: string) {
    const query = `
          query GetProduct($handle: String!) {
            productByHandle(handle: $handle) {
              id
              title
              description
              descriptionHtml
              priceRangeV2 { minVariantPrice { amount currencyCode } }
              images(first: 10) { nodes { url altText width height } }
              variants(first: 20) {
                nodes { id title price { amount } inventoryQuantity }
              }
              metafields(first: 10, namespace: "custom") {
                nodes { key value type }
              }
            }
          }
        `;
    return this.graphql(query, { handle });
  }

  /**
   * LEER CATÁLOGO DE PRODUCTOS (selector de tienda)
   */
  async getCatalog(first: number = 50, after?: string) {
    const query = `
          query GetProducts($first: Int!, $after: String) {
            products(first: $first, after: $after) {
              nodes { id title handle status images(first: 1) { nodes { url } } }
              pageInfo { hasNextPage endCursor }
            }
          }
        `;
    return this.graphql(query, { first, after });
  }

  /**
   * STOCK REAL (Urgencia legítima)
   */
  async getInventory(variantId: string) {
    const query = `
          query GetVariantInventory($variantId: ID!) {
            productVariant(id: $variantId) {
                inventoryQuantity
                inventoryItem { tracked }
            }
          }
        `;
    return this.graphql(query, { variantId });
  }

  // ─── LANDINGS ──────────────────────────────────────────────

  /**
   * PUBLICAR LANDING EN SHOPIFY
   */
  async createPageInShopify(title: string, html: string, published: boolean = false) {
    const query = `
          mutation CreatePage($page: PageCreateInput!) {
            pageCreate(page: $page) {
              page { id handle title }
              userErrors { field message }
            }
          }
        `;
    const variables = {
      page: {
        title,
        bodyHtml: html,
        published
      }
    };
    return this.graphql(query, variables);
  }

  // ─── WEBHOOKS & OPS ────────────────────────────────────────

  /**
   * SETUP WEBHOOKS (Oct 2024 Legacy REST persists for Webhooks)
   */
  async setupWebhooks(baseUrl: string) {
    const topics = [
      'orders/create',
      'orders/updated',
      'checkouts/create'
    ];

    const results = [];
    for (const topic of topics) {
      const res = await this.rest('webhooks.json', {
        method: "POST",
        body: JSON.stringify({
          webhook: {
            topic,
            address: `${baseUrl}/api/webhooks/shopify/${topic.replace('/', '_')}`,
            format: "json",
          },
        }),
      });
      results.push(res);
    }
    return results;
  }

  async getOrderDetails(orderId: string) {
    return this.rest(`orders/${orderId}.json`);
  }

  async cancelOrder(orderId: string, reason: string = "customer") {
    return this.rest(`orders/${orderId}/cancel.json`, {
      method: "POST",
      body: JSON.stringify({
        reason: reason,
        note: "Anulado desde el Centro de Operaciones"
      }),
    });
  }

  /**
   * SYNC HISTÓRICO COMPLETO (GraphQL)
   */
  async getOrdersHistorical(options: { from?: string; cursor?: string; status?: string } = {}) {
    const query = `
          query GetHistoricalOrders($first: Int!, $after: String, $query: String) {
            orders(first: $first, after: $after, query: $query) {
              nodes {
                id
                name
                createdAt
                updatedAt
                displayFulfillmentStatus
                displayFinancialStatus
                totalPriceSet { shopMoney { amount } }
                customer { firstName lastName email phone }
                shippingAddress { address1 address2 city province zip country }
                tags
                note
                customAttributes { key value }
                lineItems(first: 20) {
                    nodes {
                        title
                        quantity
                        variant { id sku price }
                    }
                }
                fulfillments(first: 5) {
                    trackingInfo { number url company }
                }
              }
              pageInfo { hasNextPage endCursor }
            }
          }
        `;

    const filter = [];
    if (options.from) filter.push(`created_at:>=${options.from}`);
    if (options.status) filter.push(`status:${options.status}`);

    const variables = {
      first: 50,
      after: options.cursor,
      query: filter.length > 0 ? filter.join(' AND ') : undefined
    };

    const data = await this.graphql(query, variables);
    return {
      orders: data.orders.nodes,
      pageInfo: data.orders.pageInfo
    };
  }

  /**
   * CATÁLOGO PRODUCTOS DETALLADO
   */
  async getProductsDetailed(first: number = 50, after?: string) {
    const query = `
          query GetDetailedProducts($first: Int!, $after: String) {
            products(first: $first, after: $after) {
              nodes {
                id
                title
                handle
                status
                productType
                vendor
                tags
                createdAt
                updatedAt
                images(first: 1) { nodes { url } }
                variants(first: 20) {
                  nodes {
                    id
                    sku
                    price
                    inventoryQuantity
                  }
                }
              }
              pageInfo { hasNextPage endCursor }
            }
          }
        `;
    const data = await this.graphql(query, { first, after });
    return {
      products: data.products.nodes,
      pageInfo: data.products.pageInfo
    };
  }

  /**
   * REST GET PRODUCTS (For legacy sync patterns)
   */
  async getProducts() {
    return this.rest('products.json');
  }
}
