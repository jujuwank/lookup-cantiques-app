exports.handler = async function () {
  const sheetUrl =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vT8XpYXfs_ilNG9AX7FqjCQkR-_b4k3DhZaY0n8m_7HO8HZfESSnxvhasnV4-Vk-PF8XscgIcFSXjXQ/pub?gid=643246372&single=true&output=csv";

  try {
    const response = await fetch(sheetUrl);
    const csv = await response.text();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8"
      },
      body: csv
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: "Erreur lors du chargement Google Sheets"
    };
  }
};