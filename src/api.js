//Функция для выполнения запросов к API
async function fetchData(action, params = {}) {
  const password = "Valantis";
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const md5 = require("md5");

  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "X-Auth": md5(`${password}_${timestamp}`),
    },
    body: JSON.stringify({ action, params }),
  };

  try {
    const response = await fetch(
      "https://api.valantis.store:41000/",
      requestOptions
    );
    if (!response.ok) {
      throw new Error(`Ошибка ${response.status}`);
    }
    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error("Ошибка при выполнении запроса:", error);
    // Повторный запрос при ошибке
    return fetchData(action, params);
  }
}

//Функция для получения списка ID товаров и лимит
export async function getProductIds(offset = 0, limit = 50) {
  const ids = await fetchData("get_ids", { offset, limit: limit + 1 }); //на один товар больше на 1ой стр
  return ids.filter((id, index) => ids.indexOf(id) === index);
}

//Функция для получения информации о товарах по их ID
export async function getProducts(ids) {
  if (!ids || ids.length === 0) return null;
  const params = { ids };
  return await fetchData("get_items", params);
}

//Функция для получения доступных полей товаров
export async function getFields(field) {
  try {
    const brands = await fetchData("get_fields", { field });
    if (!brands || brands.length === 0) {
      return [];
    }
    //фильтрую уникал и непустые значения
    const uniqueBrands = brands.filter((brand) => brand !== null);
    return Array.from(new Set(uniqueBrands)); //убираю дубли
  } catch (err) {
    console.error("Ошибка", err);
    return [];
  }
}

//запрашиваю доступные значения поля brand
export async function fetchBrands() {
  try {
    const brands = await getFields("brand");
    return brands;
  } catch (err) {
    console.error("Ошибка при получении брендов", err);
  }
}

//получаю все цены
export async function fetchPrice() {
  try {
    const price = await getFields("price");
    return price;
  } catch (err) {
    console.error("Ошибка при получении цен", err);
    return [];
  }
}

//фильтрация по цене
export async function filterPrice(price) {
  try {
    const response = await fetchData("filter", {
      price,
    });
    return response;
  } catch (err) {
    console.error("Ошибка при фильтрации", err);
    return [];
  }
}

//получаю все названия
export async function fetchProductName() {
  try {
    const product = await getFields("product");
    return product;
  } catch (err) {
    console.error("Ошибка при получении названия", err);
    return [];
  }
}
