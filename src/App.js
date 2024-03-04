import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import "./App.css";
import {
  getProductIds,
  getProducts,
  fetchBrands,
  fetchPrice,
  filterPrice,
  fetchProductName,
} from "./api";
import {
  setAllProducts,
  setProducts,
  setFilteredProductsName,
  setLoading,
  setSearchQuery,
} from "./redux/slices/productSlice";
import {
  setCurrentPage,
  setStartPage,
  setShowPagination,
} from "./redux/slices/paginationSlice";
import {
  setSelectedBrands,
  setAvailableBrands,
} from "./redux/slices/brandsSlice";
import { setValuePrice, setAvailablePrices } from "./redux/slices/priceSlice";

function App() {
  const products = useSelector((state) => state.products.products);
  const allProducts = useSelector((state) => state.products.allProducts);
  const loading = useSelector((state) => state.products.loading);
  const searchQuery = useSelector((state) => state.products.searchQuery); // Состояние для хранения поискового запроса

  const currentPage = useSelector((state) => state.pagination.currentPage);
  const startPage = useSelector((state) => state.pagination.startPage);
  const showPagination = useSelector(
    (state) => state.pagination.showPagination
  );

  const selectedBrands = useSelector((state) => state.brands.selectedBrands); // состояние для избран брендов
  const availableBrands = useSelector((state) => state.brands.availableBrands); // состояние для доступных брендов

  const valuePrice = useSelector((state) => state.price.valuePrice); //цена

  const dispatch = useDispatch();

  const [showScrollButton, setShowScrollButton] = useState(false); //кнопка наверх

  const pageCount = 10; //кол-во стр в пагинации
  const pageSize = 50; //кол-во товаров на стр

  useEffect(() => {
    const fetchData = async () => {
      dispatch(setLoading(true));
      try {
        const ids = await getProductIds(0, 9999);
        const productsData = await getProducts(ids);

        // Убираю дубликаты по id
        const uniqueProducts = [];
        const uniqueIds = [];
        productsData.forEach((product) => {
          if (!uniqueIds.includes(product.id)) {
            uniqueIds.push(product.id);
            uniqueProducts.push(product);
          }
        });

        dispatch(setAllProducts(uniqueProducts));
        dispatch(setProducts(uniqueProducts.slice(0, pageSize)));

        dispatch(setLoading(false));
      } catch (err) {
        console.error("Ошибка при загрузке всех товаров", err);
        dispatch(setLoading(false));
      }
    };

    fetchData();

    return () => {};
  }, [dispatch]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        dispatch(setLoading(true));
        const offset = (currentPage - 1) * pageSize;
        const limit = currentPage === 1 ? pageSize + 1 : pageSize;

        const ids = await getProductIds(offset, limit);
        const productsData = await getProducts(ids.slice(0, pageSize));

        // Убираю дубликаты по id
        const unProducts = [];
        const unIds = [];
        productsData.forEach((product) => {
          if (!unIds.includes(product.id)) {
            unIds.push(product.id);
            unProducts.push(product);
          }
        });

        dispatch(setProducts(unProducts)); //обновляю текущ товары для отображения

        dispatch(setLoading(false));
      } catch (error) {
        console.error("Ошибка при загрузке товаров:", error);
        dispatch(setLoading(false));
      }
    };
    fetchProducts();
  }, [currentPage, dispatch]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const brands = await fetchBrands(); // Загрузка доступных брендов
        dispatch(setAvailableBrands(brands));

        const prices = await fetchPrice(); // Загрузка доступных цен
        dispatch(setAvailablePrices(prices)); // Сохранение полученных цен в состояние

        const name = await fetchProductName(); //загрузка доступных названий
        dispatch(setFilteredProductsName(name));

        dispatch(setLoading(false));
      } catch (err) {
        console.error("Ошибка при загрузке данных", err);
        dispatch(setLoading(false));
      }
    };
    fetchInitialData();
  }, [dispatch]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setShowScrollButton(true);
      } else {
        setShowScrollButton(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handlePrevPage = () => {
    const newStartPage = startPage - pageCount;
    const newPage = currentPage - pageCount;
    if (newStartPage >= 1) {
      //предотвращаю переход в отрицательные значения стр
      dispatch(setCurrentPage(newPage));
      dispatch(setStartPage(newStartPage));
    } else {
      //если начал стр меньше 1,то устанавливаю ее 1
      dispatch(setCurrentPage(1));
      dispatch(setStartPage(1));
    }
  };
  const handleNextPage = () => {
    const newStartPage = startPage + pageCount;
    const newPage = currentPage + pageCount;
    dispatch(setCurrentPage(newPage));
    dispatch(setStartPage(newStartPage));
  };

  const handlePageClick = (pageNumber) => {
    dispatch(setCurrentPage(pageNumber));
  };

  const renderPaginator = () => {
    if (!showPagination) {
      return null; // Если пагинация скрыта, не отображаю её
    }
    const pagination = [];
    const endPage = startPage + pageCount - 1;
    for (let i = startPage; i <= endPage; i++) {
      pagination.push(
        <button
          className="paginator_num"
          key={i}
          onClick={() => handlePageClick(i)}
          disabled={i === currentPage}
        >
          {i}
        </button>
      );
    }
    return pagination;
  };

  const filteredProducts = selectedBrands
    ? products.filter((product) => product.brand === selectedBrands)
    : products;

  const handleBrandChange = async (event) => {
    const selectedBrand = event.target.value;
    dispatch(setSelectedBrands(selectedBrand));
    // Фильтрация товаров по бренду и названию
    const filteredByBrandAndName = allProducts.filter(
      (product) =>
        (selectedBrand === "" || product.brand === selectedBrand) && // Фильтрация по бренду
        product.product.toLowerCase().includes(searchQuery.toLowerCase()) // Фильтрация по названию
    );
    // Применение фильтрации по цене, если выбрана
    if (valuePrice !== "") {
      const priceNumber = parseFloat(valuePrice);
      if (!isNaN(priceNumber)) {
        const filteredByPrice = await filterPrice(priceNumber); // Фильтрация по цене
        const filteredByPriceProducts = await getProducts(filteredByPrice);
        // Применение дополнительной фильтрации по цене
        const productsToShow = filteredByPriceProducts.filter((product) =>
          filteredByBrandAndName.some(
            (filteredProduct) => filteredProduct.id === product.id
          )
        );
        dispatch(setProducts(productsToShow));
      } else {
        console.warn("Цена должна быть числом");
      }
    } else {
      // Если цена не выбрана, применяю только фильтрацию по бренду и названию
      dispatch(setProducts(filteredByBrandAndName));
    }
    dispatch(setShowPagination(false));
  };

  const handleFilterPrice = async () => {
    try {
      dispatch(setLoading(true));
      const price = parseFloat(valuePrice);
      if (!isNaN(price)) {
        // Фильтрую товары по цене
        const filteredIds = await filterPrice(price);
        const filteredProducts = await getProducts(filteredIds);
        // Применение дополнительной фильтрации по бренду, если выбран
        const productsToShow = filteredProducts.filter(
          (product) => selectedBrands === "" || product.brand === selectedBrands
        );
        // Устанавливаю отфильтрованные товары
        dispatch(setProducts(productsToShow));
      }
      dispatch(setLoading(false));
      dispatch(setShowPagination(false)); // Скрыть пагинацию
    } catch (error) {
      console.error("Ошибка при фильтрации товаров по цене:", error);
      dispatch(setLoading(false));
    }
  };

  const handleFilterProduct = async () => {
    const lowercaseQuery = searchQuery.toLowerCase();
    let filtered = allProducts.filter(
      (product) =>
        product.product.toLowerCase().includes(lowercaseQuery) &&
        (selectedBrands === "" || product.brand === selectedBrands)
    );
    // Применение фильтрации по цене, если цена выбрана
    if (valuePrice !== "") {
      const price = parseFloat(valuePrice);
      if (!isNaN(price)) {
        const filteredIds = await filterPrice(price);
        const filteredByPriceProducts = await getProducts(filteredIds);
        // Применение дополнительной фильтрации по цене
        filtered = filteredByPriceProducts.filter((product) =>
          filtered.some((filteredProduct) => filteredProduct.id === product.id)
        );
      } else {
        console.warn("Цена должна быть числом");
      }
    }
    dispatch(setProducts(filtered));
    dispatch(setShowPagination(false)); // Скрыть пагинацию
  };

  const handleResetFilters = () => {
    dispatch(setSelectedBrands("")); // Сброс выбранного бренда
    dispatch(setValuePrice("")); // Сброс выбранной цены
    dispatch(setSearchQuery("")); //сброс названия
    dispatch(setShowPagination(true)); // Вернуть пагинацию
    dispatch(setCurrentPage(1)); // Вернуться на первую страницу
    // Обновить список товаров на странице в соответствии с первоначальными данными
    dispatch(setProducts(allProducts.slice(0, pageSize)));
  };
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" }); // Прокрутка страницы вверх
  };

  return (
    <div className="App">
      <button
        className={`scrollToTop ${showScrollButton ? "visible" : ""}`}
        onClick={scrollToTop}
      >
        ↑
      </button>

      <h1>Список товаров</h1>
      <div className="filters">
        <div className="filter">
          <label htmlFor="brand">
            <h2>Выберите бренд:</h2>
          </label>
          <select
            id="brand"
            value={selectedBrands}
            onChange={handleBrandChange}
          >
            <option value="">Все бренды</option>
            {availableBrands.map((brand, index) => (
              <option key={index} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        </div>

        <div className="filter">
          {" "}
          <h2>Напишите цену:</h2>
          <div>
            <input
              className="input_price"
              onChange={(event) => {
                dispatch(setValuePrice(event.target.value));
              }}
              type="number"
              value={valuePrice}
            />

            <button onClick={handleFilterPrice}> Применить</button>
          </div>
        </div>

        <div className="filter">
          <h2>Поиск по названию:</h2>
          <div>
            <input
              type="text"
              placeholder="Введите название товара"
              value={searchQuery}
              onChange={(event) => dispatch(setSearchQuery(event.target.value))}
            />
            <button onClick={handleFilterProduct}>Применить</button>
          </div>
        </div>
      </div>

      <button className="removeButton" onClick={handleResetFilters}>
        Сбросить все фильтры
      </button>
      <br />
      <div className="paginator">
        {" "}
        {showPagination && (
          <button onClick={handlePrevPage} disabled={currentPage === 1}>
            Назад
          </button>
        )}
        {renderPaginator()}
        {showPagination && <button onClick={handleNextPage}>Вперед</button>}
      </div>

      {loading ? (
        <p>Загрузка товаров...</p>
      ) : (
        <div>
          <ul className="App_block">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <li key={product.id} className="App_elem">
                  <p className="product">{product.product}</p>
                  <p className="product_brand">{product.brand}</p>
                  <p className="product_id">{product.id}</p>
                  <p className="product_price">{product.price} ₽</p>
                </li>
              ))
            ) : (
              <p>Нет товаров для отображения</p>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
