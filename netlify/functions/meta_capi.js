const crypto = require('crypto');

exports.handler = async (event, context) => {
  // Apenas aceita requisições POST do nosso formulário
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // Credenciais Hardcoded a pedido do usuário (Repositorio será privado)
  const PIXEL_ID = "2241113573369953";
  const TOKEN = "EAAGVCxhxEdcBRtM9RW428vcPI36gzADx1XJL3dopqJaZCN8AG090IE3twibYWx2HuCjEMdFDlzSly3oWYAwGzzCWZAp32Rap5occzAi9er1l5Fx14pp2kYNz19EdL8QuwirmJchPZCf4gOyDGuTi5DC7tQW4y0FWZBVq9XEG2UScUzNREW37ZB6Xi23OmV1dytAZDZD";
  const API_VERSION = "v19.0";

  try {
    const data = JSON.parse(event.body);
    
    // Pega o IP e User Agent do cliente para enviar ao Meta
    const clientIpAddress = event.headers["x-forwarded-for"] || event.headers["client-ip"] || "";
    const clientUserAgent = event.headers["user-agent"] || "";

    // Estrutura do Payload CAPI (Conversions API)
    const payload = {
      data: [
        {
          event_name: data.event_name || 'Contact',
          event_time: Math.floor(Date.now() / 1000),
          action_source: "website",
          event_id: data.event_id,
          event_source_url: data.event_source_url,
          user_data: {
            client_ip_address: clientIpAddress,
            client_user_agent: clientUserAgent
          }
        }
      ]
    };

    // Fazer Hash SHA-256 do E-mail (Exigência do Facebook CAPI)
    if (data.email) {
      const emailHash = crypto.createHash('sha256').update(data.email.trim().toLowerCase()).digest('hex');
      payload.data[0].user_data.em = [emailHash];
    }

    // Fazer Hash SHA-256 do Telefone/WhatsApp (Exigência do Facebook CAPI)
    if (data.phone) {
      // Remove tudo que não for número e adiciona o código do Brasil se não tiver
      let phoneClean = data.phone.replace(/\D/g, '');
      if (phoneClean.length === 10 || phoneClean.length === 11) {
        phoneClean = '55' + phoneClean; // Adiciona +55
      }
      const phoneHash = crypto.createHash('sha256').update(phoneClean).digest('hex');
      payload.data[0].user_data.ph = [phoneHash];
    }

    // Disparar requisição para a Graph API do Meta
    // Nota: O Netlify suporta fetch() nativamente na v18+ do Node
    const response = await fetch(`https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, result })
    };
  } catch (error) {
    console.error("Meta CAPI Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
