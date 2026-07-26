/**
 * Seed verossímil — Fase 2 (revisão visual).
 * 8 vendedores fictícios (claramente "(Exemplo)") e 30 anúncios com specs
 * plausíveis e FOTOS REAIS servidas de /public/seed/.
 * Idempotente: UUIDs determinísticos por chave; limpa e reinsere.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { randomUUID, createHash } from "node:crypto";

const pool = await mysql.createPool({ uri: process.env.DATABASE_URL!, connectionLimit: 3 });

function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
function did(key: string): string {
  const h = createHash("sha256").update("seed:" + key).digest("hex");
  return [h.slice(0, 8), h.slice(8, 12), "4" + h.slice(13, 16), "8" + h.slice(17, 20), h.slice(20, 32)].join("-");
}

const [catRows] = await pool.query<any[]>("SELECT id, slug FROM categories");
const catBySlug = new Map<string, string>(catRows.map((c: any) => [c.slug, c.id]));
const catEquip = catBySlug.get("equipamentos-industriais");
const catMaq = catBySlug.get("maquinas");
const catSucata = catBySlug.get("sucata-metalica");
if (!catEquip || !catMaq || !catSucata) {
  console.error("Categorias esperadas não encontradas. Slugs:", [...catBySlug.keys()]);
  process.exit(1);
}

// ─── 8 vendedores fictícios ───
const sellers = [
  { key: "metalurgica-sao-jorge", companyName: "Metalúrgica São Jorge (Exemplo)", name: "Jorge Andrade", phone: "+5511999900001", city: "Guarulhos", state: "SP",
    description: "Há 22 anos no mercado de máquinas e equipamentos industriais usados. Compra e venda de motores elétricos, redutores e conjuntos motorredutores. Desmontagem de plantas industriais completas. Atendemos toda a Grande São Paulo com entrega própria e todo o Brasil via transportadora.",
    verified: true, cats: [catEquip, catMaq, catSucata] },
  { key: "bombas-vale-do-aco", companyName: "Bombas & Equipamentos Vale do Aço (Exemplo)", name: "Marcos Pereira", phone: "+5531999900002", city: "Ipatinga", state: "MG",
    description: "Especializada em bombas industriais: centrífugas, helicoidais, de engrenagem e dosadoras. Estoque permanente de bombas KSB, Imbil, Netzsch e Weatherford revisadas com garantia de 90 dias. Também compramos bombas paradas ou sucateadas para recondicionamento.",
    verified: true, cats: [catEquip] },
  { key: "eletromaq-sul", companyName: "Eletromaq Sul Máquinas (Exemplo)", name: "Cláudia Ritter", phone: "+5551999900003", city: "Caxias do Sul", state: "RS",
    description: "Motores elétricos WEG novos de pronta entrega e usados revisados, de 0,5 a 500 cv. Rebobinagem própria com laudo de ensaio. Redutores e variadores de velocidade. Emitimos nota fiscal e atendemos indústrias de todo o Sul.",
    verified: false, cats: [catEquip, catMaq] },
  { key: "usinagem-campinas", companyName: "Rocha Máquinas Operatrizes (Exemplo)", name: "Antônio Rocha", phone: "+5519999900004", city: "Campinas", state: "SP",
    description: "Tornos, fresadoras, furadeiras e prensas usadas e revisadas. Mais de 30 anos comprando e vendendo máquinas operatrizes. Showroom com 80 máquinas em Campinas. Aceitamos sua máquina usada como parte do pagamento.",
    verified: true, cats: [catMaq] },
  { key: "sucata-forte-abc", companyName: "Sucata Forte ABC (Exemplo)", name: "Valdir Nunes", phone: "+5511999900005", city: "Santo André", state: "SP",
    description: "Compra e venda de sucata metálica industrial: aço, ferro fundido, cobre, bronze e alumínio. Retirada com caminhão munck no ABC e capital. Pesagem com balança aferida e pagamento à vista. Também vendemos peças e máquinas para aproveitamento.",
    verified: false, cats: [catSucata] },
  { key: "hidraulica-joinville", companyName: "Hidráulica & Pneumática Joinville (Exemplo)", name: "Renate Schmidt", phone: "+5547999900006", city: "Joinville", state: "SC",
    description: "Compressores de ar, unidades hidráulicas e bombas de alta pressão usadas e revisadas. Assistência técnica própria com peças de reposição. Atendemos o polo metalmecânico de Santa Catarina e Paraná.",
    verified: true, cats: [catEquip] },
  { key: "motores-nordeste", companyName: "Motores & Redutores Nordeste (Exemplo)", name: "Francisco Sales", phone: "+5581999900007", city: "Recife", state: "PE",
    description: "Maior estoque de motores elétricos usados do Nordeste. Motores de 1 a 300 cv, redutores e motorredutores para usinas, indústria alimentícia e construção. Despachamos para todo o Brasil.",
    verified: false, cats: [catEquip] },
  { key: "maquinas-oeste-parana", companyName: "Máquinas Oeste Paraná (Exemplo)", name: "Ivo Baumgartner", phone: "+5545999900008", city: "Cascavel", state: "PR",
    description: "Máquinas e equipamentos para agroindústria e metalurgia: tornos, prensas, pontes rolantes, redutores de grande porte. Desmontagem e remoção industrial com equipe própria. 15 anos de mercado.",
    verified: false, cats: [catMaq, catSucata] },
];

// ─── 30 anúncios ───
type SeedListing = {
  key: string; sellerKey: string; cat: string; title: string; description: string;
  city: string; state: string; price: string | null; priceOnRequest?: boolean;
  condition: "new" | "used_good" | "used_fair" | "scrap";
  status?: "active" | "sold";
  specs: [string, string, string | null][];
  photo: string; // caminho em /public/seed
};
const L: SeedListing[] = [
  // ── Metalúrgica São Jorge (Guarulhos/SP) ──
  { key: "motor-weg-w22-50cv", sellerKey: "metalurgica-sao-jorge", cat: catEquip,
    title: "Motor Elétrico WEG W22 50 cv 4 polos 220/380V usado revisado",
    description: "Motor trifásico WEG linha W22 Plus, 50 cv, 4 polos (1770 rpm), carcaça 200L, tensão 220/380 V, IP55. Revisado em nossa oficina: rolamentos novos SKF, rebobinagem testada com laudo de resistência de isolamento (megôhmetro). Pintura eletrostática azul RAL 5009. Garantia de 90 dias contra defeito da revisão. Aceitamos seu motor queimado na troca. Emitimos NF-e.",
    city: "Guarulhos", state: "SP", price: "6800.00", condition: "used_good",
    specs: [["Fabricante","WEG",null],["Linha","W22 Plus",null],["Potência","50","cv"],["Polos","4 (1770 rpm)",null],["Tensão","220/380","V"],["Carcaça","200L",null],["Grau de proteção","IP55",null],["Frequência","60","Hz"]],
    photo: "/seed/motor-weg-azul.jpg" },
  { key: "redutor-sew-k87", sellerKey: "metalurgica-sao-jorge", cat: catMaq,
    title: "Redutor SEW-Eurodrive K87 redução 1:71,75 com flange B5",
    description: "Redutor de engrenagens cônicas SEW-Eurodrive série K87, redução 1:71,75, torque de saída nominal 4.300 Nm, eixo oco de 70 mm com flange B5. Retirado de esteira transportadora em funcionamento (desativação de linha). Sem vazamentos, engrenagens em ótimo estado — vídeo do teste em bancada pelo WhatsApp. Compatível com motor 132M/L.",
    city: "Guarulhos", state: "SP", price: "9500.00", condition: "used_good",
    specs: [["Fabricante","SEW-Eurodrive",null],["Modelo","K87",null],["Redução","1:71,75",null],["Torque de saída","4300","Nm"],["Eixo de saída","Oco 70","mm"],["Fixação","Flange B5",null]],
    photo: "/seed/motoredutor-sew-vermelho.jpg" },
  { key: "motor-weg-15cv-vendido", sellerKey: "metalurgica-sao-jorge", cat: catEquip,
    title: "Motor Elétrico WEG 15 cv 6 polos 1160 rpm carcaça 160M",
    description: "Motor WEG 15 cv, 6 polos (1160 rpm), carcaça 160M, 220/380 V, usado em bom estado, revisado. Este já saiu — mas trabalhamos com motores de 10 a 30 cv continuamente e costumamos ter unidades equivalentes em estoque. Consulte pelo WhatsApp.",
    city: "Guarulhos", state: "SP", price: "2900.00", condition: "used_good", status: "sold",
    specs: [["Fabricante","WEG",null],["Potência","15","cv"],["Polos","6 (1160 rpm)",null],["Tensão","220/380","V"],["Carcaça","160M",null]],
    photo: "/seed/motor-dc-usado.jpg" },
  { key: "lote-motores-diversos", sellerKey: "metalurgica-sao-jorge", cat: catEquip,
    title: "Lote 12 motores elétricos 1 a 10 cv usados no estado",
    description: "Lote fechado com 12 motores trifásicos de 1 a 10 cv, marcas WEG, Kohlbach e Eberle, vendidos no estado (sem revisão). Ideal para revendedores e oficinas de rebobinagem. Relação completa com plaquetas fotografadas disponível pelo WhatsApp. Carregamento por nossa conta.",
    city: "Guarulhos", state: "SP", price: "5400.00", condition: "used_fair",
    specs: [["Quantidade","12","un"],["Faixa de potência","1 a 10","cv"],["Marcas","WEG, Kohlbach, Eberle",null],["Estado","No estado, sem revisão",null]],
    photo: "/seed/motores-galpao-pallets.jpg" },
  { key: "redutor-transmotecnica-sucata", sellerKey: "metalurgica-sao-jorge", cat: catSucata,
    title: "Redutor Transmotécnica TCN 350 para retirada de peças",
    description: "Redutor de coroa e sem-fim Transmotécnica TCN 350, travado, vendido no estado para aproveitamento de peças (carcaça, coroa de bronze, tampas e eixo de entrada íntegros). Coroa de bronze pesa aprox. 18 kg. Retirada no local em Guarulhos ou despacho por transportadora com frete por conta do comprador.",
    city: "Guarulhos", state: "SP", price: "850.00", condition: "scrap",
    specs: [["Fabricante","Transmotécnica",null],["Modelo","TCN 350",null],["Estado","Travado — p/ peças",null],["Coroa","Bronze ~18 kg",null]],
    photo: "/seed/redutor-rosca-sem-fim-azul.jpg" },

  // ── Bombas Vale do Aço (Ipatinga/MG) ──
  { key: "bomba-ksb-meganorm-80-250", sellerKey: "bombas-vale-do-aco", cat: catEquip,
    title: "Bomba Centrífuga KSB Meganorm 80-250 com motor 25 cv",
    description: "Conjunto motobomba KSB Meganorm 80-250, vazão até 160 m³/h, altura manométrica 70 mca, bocais 80x65 mm, rotor 250 mm em ferro fundido. Acoplada a motor WEG 25 cv 2 polos. Selo mecânico novo, revisão completa com teste hidrostático. Para captação de água industrial, torres de resfriamento e irrigação. Garantia de 90 dias.",
    city: "Ipatinga", state: "MG", price: "12400.00", condition: "used_good",
    specs: [["Fabricante","KSB",null],["Modelo","Meganorm 80-250",null],["Vazão máx.","160","m³/h"],["Altura manométrica","70","mca"],["Rotor","250 mm ferro fundido",null],["Motor","WEG 25 cv 2 polos",null]],
    photo: "/seed/bomba-centrifuga-grande.jpg" },
  { key: "bomba-netzsch-nm063", sellerKey: "bombas-vale-do-aco", cat: catEquip,
    title: "Bomba Helicoidal Netzsch NM063 c/ redutor e inversor",
    description: "Bomba de cavidade progressiva Netzsch NEMO NM063, vazão 18 m³/h a 4 bar, rotor em aço inox 316 e estator em Buna-N novo. Acompanha motorredutor SEW 7,5 cv e inversor WEG CFW500. Ideal para lodo, polpa e fluidos viscosos. Testada com vídeo disponível.",
    city: "Ipatinga", state: "MG", price: "18900.00", condition: "used_good",
    specs: [["Fabricante","Netzsch",null],["Modelo","NEMO NM063",null],["Vazão","18","m³/h"],["Pressão","4","bar"],["Rotor","Inox 316",null],["Estator","Buna-N novo",null],["Acionamento","SEW 7,5 cv + CFW500",null]],
    photo: "/seed/bomba-engrenagem-globalgear.jpg" },
  { key: "lote-bombas-centrifugas", sellerKey: "bombas-vale-do-aco", cat: catEquip,
    title: "Lote 4 bombas centrífugas Imbil e KSB 5 a 15 cv",
    description: "Lote com 4 bombas centrífugas (2 Imbil ITAP, 1 KSB C1050, 1 Schneider BC-92), potências de 5 a 15 cv, todas com motor. Vendidas no estado, girando livres, sem travamento. Preço do lote fechado; vendemos separado sob consulta.",
    city: "Ipatinga", state: "MG", price: "7200.00", condition: "used_fair",
    specs: [["Quantidade","4","un"],["Marcas","Imbil, KSB, Schneider",null],["Potências","5 a 15","cv"],["Estado","No estado, girando livres",null]],
    photo: "/seed/bombas-centrifugas-pallet.jpg" },
  { key: "bomba-viking-hl4195", sellerKey: "bombas-vale-do-aco", cat: catEquip,
    title: "Bomba de Engrenagem Viking HL4195 5,5 m³/h ferro fundido",
    description: "Bomba de engrenagens internas Viking HL4195, vazão 5,5 m³/h, corpo em ferro fundido com camisa de aquecimento, vedação por gaxeta. Indicada para óleos, resinas e melaço. Usada, em bom estado de conservação — vídeo de teste disponível. Sem motor (ponta de eixo livre).",
    city: "Ipatinga", state: "MG", price: "4700.00", condition: "used_fair",
    specs: [["Fabricante","Viking",null],["Modelo","HL4195",null],["Vazão","5,5","m³/h"],["Corpo","Ferro fundido c/ camisa",null],["Vedação","Gaxeta",null],["Acionamento","Ponta de eixo livre",null]],
    photo: "/seed/bomba-usada-pallet.jpg" },
  { key: "bombas-processo-vendida", sellerKey: "bombas-vale-do-aco", cat: catEquip,
    title: "Bomba Dosadora ProMinent Sigma S2Cb 350 l/h",
    description: "Bomba dosadora a diafragma ProMinent Sigma/2 S2Cb, 350 l/h a 4 bar, cabeçote em PVDF. Este já saiu — mas trabalhamos com dosadoras ProMinent e Grundfos continuamente; costumamos ter modelos equivalentes. Chame no WhatsApp e consulte o estoque da semana.",
    city: "Ipatinga", state: "MG", price: "3800.00", condition: "used_good", status: "sold",
    specs: [["Fabricante","ProMinent",null],["Modelo","Sigma/2 S2Cb",null],["Vazão","350","l/h"],["Pressão","4","bar"],["Cabeçote","PVDF",null]],
    photo: "/seed/bombas-instaladas-planta.jpg" },

  // ── Eletromaq Sul (Caxias do Sul/RS) ──
  { key: "motor-weg-100cv", sellerKey: "eletromaq-sul", cat: catEquip,
    title: "Motor Elétrico WEG W22 100 cv 4 polos carcaça 280S/M",
    description: "Motor trifásico WEG W22, 100 cv, 4 polos (1785 rpm), carcaça 280S/M, 380/660 V, IP55, usado revisado com laudo de ensaio elétrico. Rolamentos novos, pintura refeita. Garantia de 6 meses da rebobinagem. Frete negociável para todo o Sul.",
    city: "Caxias do Sul", state: "RS", price: "14800.00", condition: "used_good",
    specs: [["Fabricante","WEG",null],["Linha","W22",null],["Potência","100","cv"],["Polos","4 (1785 rpm)",null],["Tensão","380/660","V"],["Carcaça","280S/M",null],["Grau de proteção","IP55",null]],
    photo: "/seed/motor-grande-azul.jpg" },
  { key: "motor-weg-5cv-novo", sellerKey: "eletromaq-sul", cat: catEquip,
    title: "Motor Elétrico WEG W22 IR3 Premium 5 cv 2 polos NOVO",
    description: "Motor WEG W22 IR3 Premium novo, na caixa, 5 cv, 2 polos (3510 rpm), carcaça 100L, 220/380 V, alto rendimento IR3. Pronta entrega, com nota fiscal e garantia WEG de 18 meses. Temos também 3, 7,5 e 10 cv novos em estoque.",
    city: "Caxias do Sul", state: "RS", price: "2350.00", condition: "new",
    specs: [["Fabricante","WEG",null],["Linha","W22 IR3 Premium",null],["Potência","5","cv"],["Polos","2 (3510 rpm)",null],["Tensão","220/380","V"],["Estado","Novo na caixa",null],["Garantia","18 meses WEG",null]],
    photo: "/seed/motor-azul-linha.webp" },
  { key: "motoredutor-sew-r37", sellerKey: "eletromaq-sul", cat: catMaq,
    title: "Motorredutor SEW R37 1 cv redução 1:38 saída 46 rpm",
    description: "Motorredutor de engrenagens helicoidais SEW-Eurodrive R37 DRS71M4, motor 1 cv 4 polos, redução 1:38,09, rotação de saída 46 rpm, torque 152 Nm, montagem M1 com pés. Revisado, retentores novos, óleo trocado. Ideal para esteiras e dosadores.",
    city: "Caxias do Sul", state: "RS", price: "3200.00", condition: "used_good",
    specs: [["Fabricante","SEW-Eurodrive",null],["Modelo","R37 DRS71M4",null],["Potência","1","cv"],["Redução","1:38,09",null],["Saída","46","rpm"],["Torque","152","Nm"]],
    photo: "/seed/motoredutor-sew-r37.webp" },
  { key: "motor-trifasico-30cv", sellerKey: "eletromaq-sul", cat: catEquip,
    title: "Motor Elétrico Kohlbach 30 cv 4 polos usado testado",
    description: "Motor trifásico Kohlbach 30 cv, 4 polos, carcaça 200M, 220/380 V, usado, testado em bancada com corrente equilibrada nas três fases. Sem rebobinagem (enrolamento original). Pequenos pontos de oxidação na carcaça, nada estrutural.",
    city: "Caxias do Sul", state: "RS", price: "4100.00", condition: "used_fair",
    specs: [["Fabricante","Kohlbach",null],["Potência","30","cv"],["Polos","4",null],["Tensão","220/380","V"],["Carcaça","200M",null],["Enrolamento","Original de fábrica",null]],
    photo: "/seed/motor-trifasico-instalado.jpg" },

  // ── Rocha Máquinas Operatrizes (Campinas/SP) ──
  { key: "torno-romi-tormax-30", sellerKey: "usinagem-campinas", cat: catMaq,
    title: "Torno Mecânico Romi Tormax 30 barramento 3.000 mm",
    description: "Torno universal Romi Tormax 30, distância entre pontas 3.000 mm, diâmetro admissível sobre barramento 620 mm, furo do eixo árvore 105 mm, motor 15 cv. Barramento retificado sem desgaste aparente, caixa Norton completa, placa de 4 castanhas 500 mm inclusa. Máquina funcionando, pode ser testada em nosso showroom.",
    city: "Campinas", state: "SP", price: "78000.00", condition: "used_good",
    specs: [["Fabricante","Romi",null],["Modelo","Tormax 30",null],["Entre pontas","3000","mm"],["Diâmetro s/ barramento","620","mm"],["Furo da árvore","105","mm"],["Motor","15","cv"]],
    photo: "/seed/torno-mecanico-oficina.jpg" },
  { key: "torno-nardini-nd-250", sellerKey: "usinagem-campinas", cat: catMaq,
    title: "Torno Nardini Nodus ND-250 entre pontas 1.500 mm",
    description: "Torno mecânico Nardini Nodus ND-250, entre pontas 1.500 mm, diâmetro sobre barramento 500 mm, motor 7,5 cv, avanços automáticos longitudinal e transversal. Acompanha placa 3 castanhas, luneta fixa e jogo de engrenagens. Revisão geral feita em 2024 com nota.",
    city: "Campinas", state: "SP", price: "42000.00", condition: "used_good",
    specs: [["Fabricante","Nardini",null],["Modelo","Nodus ND-250",null],["Entre pontas","1500","mm"],["Diâmetro s/ barramento","500","mm"],["Motor","7,5","cv"]],
    photo: "/seed/torno-harrison-azul.jpg" },
  { key: "fresadora-bridgeport", sellerKey: "usinagem-campinas", cat: catMaq,
    title: "Fresadora Ferramenteira Bridgeport Series I mesa 1.245 mm",
    description: "Fresadora vertical ferramenteira Bridgeport Series I, mesa 1.245 x 230 mm, cursos X/Y/Z 760/305/400 mm, cabeçote com velocidade variável 60–4.200 rpm, cone R8. Importada, 220 V monofásico convertido para trifásico. Acompanha morsa de precisão e jogo de pinças R8.",
    city: "Campinas", state: "SP", price: "36500.00", condition: "used_good",
    specs: [["Fabricante","Bridgeport",null],["Modelo","Series I",null],["Mesa","1245 x 230","mm"],["Curso X/Y/Z","760/305/400","mm"],["Rotação","60–4200","rpm"],["Cone","R8",null]],
    photo: "/seed/fresadora-bridgeport.jpg" },
  { key: "fresadora-veker-vendida", sellerKey: "usinagem-campinas", cat: catMaq,
    title: "Fresadora Universal Veker FU-2 mesa 1.325 mm",
    description: "Fresadora universal Veker FU-2 com cabeçote vertical, mesa 1.325 x 325 mm, cone ISO 40, motor 10 cv. Este já saiu — mas trabalhamos com fresadoras universais e ferramenteiras continuamente; temos outras opções no showroom de Campinas. Chame no WhatsApp.",
    city: "Campinas", state: "SP", price: "45000.00", condition: "used_good", status: "sold",
    specs: [["Fabricante","Veker",null],["Modelo","FU-2",null],["Mesa","1325 x 325","mm"],["Cone","ISO 40",null],["Motor","10","cv"]],
    photo: "/seed/fresadora-bridgeport-2.jpg" },
  { key: "prensa-excentrica-45t", sellerKey: "usinagem-campinas", cat: catMaq,
    title: "Prensa Excêntrica Jundiaí 45 toneladas freio-embreagem",
    description: "Prensa excêntrica de corpo inclinável Jundiaí PEJ-45, capacidade 45 t, mesa 560 x 380 mm, curso regulável 10–80 mm, sistema freio-embreagem pneumático com comando bimanual (NR-12 parcial — laudo de adequação por conta do comprador). Motor 5 cv.",
    city: "Campinas", state: "SP", price: "28000.00", condition: "used_fair",
    specs: [["Fabricante","Jundiaí",null],["Capacidade","45","t"],["Mesa","560 x 380","mm"],["Curso","10–80","mm"],["Comando","Bimanual pneumático",null],["Motor","5","cv"]],
    photo: "/seed/fabrica-interior.jpg" },

  // ── Sucata Forte ABC (Santo André/SP) ──
  { key: "sucata-aco-carbono-30t", sellerKey: "sucata-forte-abc", cat: catSucata,
    title: "Sucata de Aço Carbono Prensada — lote 30 toneladas",
    description: "Lote de 30 toneladas de sucata de aço carbono prensada (pacotes ~800 kg), origem industrial (recorte de estamparia), livre de contaminantes. Carregamento com munck em nosso pátio de Santo André. Preço por tonelada, negociável para retirada do lote completo. Pesagem em balança aferida pelo Inmetro.",
    city: "Santo André", state: "SP", price: "1350.00", condition: "scrap",
    specs: [["Material","Aço carbono",null],["Quantidade","30","t"],["Formato","Pacotes prensados ~800 kg",null],["Origem","Recorte de estamparia",null],["Preço","Por tonelada",null]],
    photo: "/seed/sucata-patio-aco.webp" },
  { key: "sucata-cobre-misto", sellerKey: "sucata-forte-abc", cat: catSucata,
    title: "Sucata de Cobre Misto 1ª e 2ª — 2,4 toneladas",
    description: "Sucata de cobre misto: 1,6 t de cobre 1ª (fios e barramentos limpos) e 0,8 t de cobre 2ª (com verniz e conexões). Origem: desmontagem de painéis e motores. Venda somente para empresas com CNPJ e inscrição para operar com resíduos metálicos. Preço sob consulta conforme cotação LME do dia.",
    city: "Santo André", state: "SP", price: null, priceOnRequest: true, condition: "scrap",
    specs: [["Material","Cobre 1ª e 2ª",null],["Quantidade","2,4","t"],["Origem","Painéis e motores",null],["Cotação","LME do dia",null]],
    photo: "/seed/sucata-reciclagem.jpg" },
  { key: "sucata-ferro-fundido", sellerKey: "sucata-forte-abc", cat: catSucata,
    title: "Sucata de Ferro Fundido — carcaças e bases 12 t",
    description: "Lote de 12 toneladas de ferro fundido: carcaças de motores, bases de máquinas e contrapesos. Material classificado, sem aço agregado. Ideal para fundições. Carregamento com garra em nosso pátio; despacho mínimo de 5 t.",
    city: "Santo André", state: "SP", price: "980.00", condition: "scrap",
    specs: [["Material","Ferro fundido",null],["Quantidade","12","t"],["Formato","Carcaças e bases",null],["Preço","Por tonelada",null],["Mínimo","5","t"]],
    photo: "/seed/sucata-garra-guindaste.jpg" },

  // ── Hidráulica & Pneumática Joinville (SC) ──
  { key: "compressor-atlas-ga30", sellerKey: "hidraulica-joinville", cat: catEquip,
    title: "Compressor de Parafuso Atlas Copco GA30 40 cv 2009",
    description: "Compressor de ar de parafuso Atlas Copco GA30, 40 cv, vazão 5,2 m³/min a 7,5 bar, ano 2009, 38.000 horas. Revisado: kit de válvulas, separador ar/óleo e filtros novos, óleo Roto-Inject trocado. Painel Elektronikon funcionando. Entrega instalada em Joinville e região.",
    city: "Joinville", state: "SC", price: "32000.00", condition: "used_good",
    specs: [["Fabricante","Atlas Copco",null],["Modelo","GA30",null],["Potência","40","cv"],["Vazão","5,2","m³/min"],["Pressão","7,5","bar"],["Ano","2009",null],["Horímetro","38.000","h"]],
    photo: "/seed/compressor-parafuso-usado.webp" },
  { key: "unidade-hidraulica-20cv", sellerKey: "hidraulica-joinville", cat: catEquip,
    title: "Unidade Hidráulica 20 cv 210 bar reservatório 250 L",
    description: "Unidade hidráulica com motor WEG 20 cv, bomba de pistões Rexroth A10VSO, pressão de trabalho 210 bar, reservatório 250 L com trocador de calor ar-óleo, válvulas direcionais 4/3 Rexroth. Desmontada de injetora em funcionamento. Testada e sem vazamentos.",
    city: "Joinville", state: "SC", price: "19500.00", condition: "used_good",
    specs: [["Motor","WEG 20","cv"],["Bomba","Rexroth A10VSO",null],["Pressão","210","bar"],["Reservatório","250","L"],["Válvulas","Rexroth 4/3",null]],
    photo: "/seed/bombas-instaladas-planta.jpg" },
  { key: "compressor-schulz-vendido", sellerKey: "hidraulica-joinville", cat: catEquip,
    title: "Compressor de Parafuso Schulz SRP 3020 20 cv",
    description: "Compressor de parafuso Schulz SRP 3020 Compact, 20 cv, 2,3 m³/min a 7,5 bar. Este já saiu — mas trabalhamos com compressores de parafuso de 15 a 50 cv continuamente e recebemos máquinas revisadas toda semana. Consulte disponibilidade pelo WhatsApp.",
    city: "Joinville", state: "SC", price: "18000.00", condition: "used_good", status: "sold",
    specs: [["Fabricante","Schulz",null],["Modelo","SRP 3020 Compact",null],["Potência","20","cv"],["Vazão","2,3","m³/min"],["Pressão","7,5","bar"]],
    photo: "/seed/compressor-parafuso-usado.webp" },

  // ── Motores & Redutores Nordeste (Recife/PE) ──
  { key: "motor-weg-200cv", sellerKey: "motores-nordeste", cat: catEquip,
    title: "Motor Elétrico WEG 200 cv 4 polos 440V carcaça 355M/L",
    description: "Motor trifásico WEG 200 cv, 4 polos, carcaça 355M/L, 440 V, IP55, procedência de usina sucroalcooleira (troca por motor de alto rendimento). Testado a vazio, corrente equilibrada, rolamentos sem ruído. Laudo de isolamento disponível. Içamento por conta do comprador.",
    city: "Recife", state: "PE", price: "38000.00", condition: "used_fair",
    specs: [["Fabricante","WEG",null],["Potência","200","cv"],["Polos","4",null],["Tensão","440","V"],["Carcaça","355M/L",null],["Procedência","Usina sucroalcooleira",null]],
    photo: "/seed/motor-grande-azul.jpg" },
  { key: "motoredutor-cestari-60cv", sellerKey: "motores-nordeste", cat: catMaq,
    title: "Redutor Cestari coaxial 1:25 p/ motor 60 cv usina",
    description: "Redutor coaxial Cestari de grande porte, redução 1:25, preparado para motor 60 cv carcaça 225S/M, eixo de saída 110 mm com chaveta. Usado em moenda, revisado com engrenagens e rolamentos inspecionados. Pintura nova. Base metálica inclusa.",
    city: "Recife", state: "PE", price: "22500.00", condition: "used_good",
    specs: [["Fabricante","Cestari",null],["Tipo","Coaxial",null],["Redução","1:25",null],["Motor compatível","60 cv (225S/M)",null],["Eixo de saída","110","mm"]],
    photo: "/seed/redutor-industrial-grande.png" },
  { key: "motor-eberle-40cv", sellerKey: "motores-nordeste", cat: catEquip,
    title: "Motor Elétrico Eberle 40 cv 2 polos 3540 rpm usado",
    description: "Motor trifásico Eberle 40 cv, 2 polos (3540 rpm), carcaça 200L, 220/380 V. Usado, enrolamento original testado com megôhmetro (leitura acima de 500 MΩ). Ventilador e defletora íntegros. Ideal para bombas de alta rotação.",
    city: "Recife", state: "PE", price: "5900.00", condition: "used_fair",
    specs: [["Fabricante","Eberle",null],["Potência","40","cv"],["Polos","2 (3540 rpm)",null],["Tensão","220/380","V"],["Carcaça","200L",null]],
    photo: "/seed/motor-trifasico-instalado.jpg" },

  // ── Máquinas Oeste Paraná (Cascavel/PR) ──
  { key: "redutor-gudel-grande", sellerKey: "maquinas-oeste-parana", cat: catMaq,
    title: "Redutor de Grande Porte Güdel 4:1 saída dupla",
    description: "Redutor Güdel de grande porte, relação 4:1, dupla saída, carcaça em ferro fundido, procedência de linha de laminação desativada. Engrenagens sem desgaste visível, girando livre. Peso aproximado 850 kg. Carregamento com ponte rolante em nosso pátio de Cascavel.",
    city: "Cascavel", state: "PR", price: "16800.00", condition: "used_fair",
    specs: [["Fabricante","Güdel",null],["Relação","4:1",null],["Saída","Dupla",null],["Carcaça","Ferro fundido",null],["Peso","~850","kg"]],
    photo: "/seed/redutor-gudel-4-1.jpg" },
  { key: "redutor-gudel-usado-2", sellerKey: "maquinas-oeste-parana", cat: catMaq,
    title: "Redutor Güdel AE090 usado p/ cremalheira",
    description: "Redutor Güdel AE090 para acionamento de cremalheira (gantry/pórtico), usado, com pinhão módulo 4. Folga angular dentro da especificação de fábrica. Ideal para automação de pórticos e eixos lineares de grande curso.",
    city: "Cascavel", state: "PR", price: "8900.00", condition: "used_good",
    specs: [["Fabricante","Güdel",null],["Modelo","AE090",null],["Aplicação","Cremalheira / pórtico",null],["Pinhão","Módulo 4",null]],
    photo: "/seed/redutor-gudel-usado.jpg" },
  { key: "sucata-maquinas-lote", sellerKey: "maquinas-oeste-parana", cat: catSucata,
    title: "Lote de Máquinas p/ Desmonte — 3 tornos e 2 prensas",
    description: "Lote para desmonte ou restauração: 3 tornos mecânicos nacionais (Imor e Sanches Blanes) incompletos e 2 prensas excêntricas 25 t travadas. Vendido no estado, como sucata classificada. Peso total estimado 14 t. Ótimo para fundição ou restauradores.",
    city: "Cascavel", state: "PR", price: null, priceOnRequest: true, condition: "scrap",
    specs: [["Conteúdo","3 tornos + 2 prensas",null],["Estado","P/ desmonte ou restauração",null],["Peso estimado","14","t"]],
    photo: "/seed/galpao-industrial-hero.jpg" },
];

// ─── execução ───
const conn = await pool.getConnection();
try {
  await conn.beginTransaction();
  const sellerIds = sellers.map((s) => did("user:" + s.key));
  // limpar TODOS os listings de seed anteriores (inclusive chaves antigas removidas)
  const [oldListings] = await conn.query<any[]>(`SELECT id FROM listings WHERE user_id IN (?)`, [sellerIds]);
  const oldIds = oldListings.map((r: any) => r.id);
  if (oldIds.length) {
    await conn.query(`DELETE FROM listing_specs WHERE listing_id IN (?)`, [oldIds]);
    await conn.query(`DELETE FROM listing_images WHERE listing_id IN (?)`, [oldIds]);
    await conn.query(`DELETE FROM contact_events WHERE listing_id IN (?)`, [oldIds]);
    await conn.query(`DELETE FROM listings WHERE id IN (?)`, [oldIds]);
  }
  await conn.query(`DELETE FROM seller_categories WHERE user_id IN (?)`, [sellerIds]);
  await conn.query(`DELETE FROM users WHERE id IN (?)`, [sellerIds]);

  for (const s of sellers) {
    const id = did("user:" + s.key);
    await conn.query(
      `INSERT INTO users (id, phone_e164, name, company_name, slug, description, city, state, role, is_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'seller', ?)`,
      [id, s.phone, s.name, s.companyName, s.key, s.description, s.city, s.state, s.verified ? 1 : 0]
    );
    for (const catId of [...new Set(s.cats)]) {
      await conn.query(`INSERT INTO seller_categories (id, user_id, category_id) VALUES (?, ?, ?)`, [randomUUID(), id, catId]);
    }
  }
  let hourOffset = 5;
  for (const l of L) {
    const id = did("listing:" + l.key);
    const sellerId = did("user:" + l.sellerKey);
    const slug = slugify(l.title).slice(0, 280) + "-" + id.slice(0, 6);
    const createdAt = new Date(Date.now() - hourOffset * 3_600_000);
    hourOffset += 26; // espalha ao longo de ~1 mês
    await conn.query(
      `INSERT INTO listings (id, user_id, category_id, slug, title, description, city, state, price, price_on_request, item_condition, status, sold_at, source, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'web', ?)`,
      [id, sellerId, l.cat, slug, l.title, l.description, l.city, l.state, l.price, l.priceOnRequest ? 1 : 0,
       l.condition, l.status ?? "active", l.status === "sold" ? new Date(Date.now() - 86_400_000 * 3) : null, createdAt]
    );
    for (const [k, v, u] of l.specs) {
      await conn.query(`INSERT INTO listing_specs (id, listing_id, spec_key, value, unit) VALUES (?, ?, ?, ?, ?)`, [randomUUID(), id, k, v, u]);
    }
    await conn.query(
      `INSERT INTO listing_images (id, listing_id, url, sort_order, alt_text) VALUES (?, ?, ?, 0, ?)`,
      [randomUUID(), id, l.photo, l.title]
    );
  }
  await conn.commit();
  const [[{ c: nl }]]: any = await conn.query(`SELECT COUNT(*) c FROM listings`);
  const [[{ c: nu }]]: any = await conn.query(`SELECT COUNT(*) c FROM users WHERE role='seller'`);
  console.log(`Seed OK — listings no banco: ${nl}, vendedores: ${nu}`);
} catch (e) {
  await conn.rollback();
  console.error("Seed falhou:", e);
  process.exit(1);
} finally {
  conn.release();
  await pool.end();
}
