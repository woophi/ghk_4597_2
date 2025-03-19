import { BottomSheet } from '@alfalab/core-components/bottom-sheet';
import { ButtonMobile } from '@alfalab/core-components/button/mobile';
import { Checkbox } from '@alfalab/core-components/checkbox';
import { Gap } from '@alfalab/core-components/gap';
import { Input } from '@alfalab/core-components/input';
import { Tag } from '@alfalab/core-components/tag';
import { Typography } from '@alfalab/core-components/typography';
import { ChevronRightMIcon } from '@alfalab/icons-glyph/ChevronRightMIcon';
import { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import rubIcon from './assets/rub.png';
import { LS, LSKeys } from './ls';
import { appSt } from './style.css';
import { ThxSpinner } from './thx/ThxLayout';
import { sendDataToGA, sendDataToGACalc } from './utils/events';
import { round } from './utils/round';

const min = 2000;
const max = 3_000_000;

const chips = [2000, 5000, 15000, 25000];
const chipsIncome = [
  {
    title: 'До 80 000 ₽',
    value: 80_000,
  },
  {
    title: '80 001 ₽ – 150 000 ₽',
    value: 150_000,
  },
  {
    title: '150 001 ₽ и более',
    value: 150_001,
  },
];

const MAX_GOV_SUPPORT = 360000;
const TAX = 0.13;
const INVEST_DURATION = 15;
const INTEREST_RATE = 0.07;

function calculateSumContributions(monthlyPayment: number): number {
  return round(monthlyPayment * 12 * INVEST_DURATION, 2);
}
function calculateStateSupport(monthlyPayment: number, subsidyRate: number): number {
  const support = monthlyPayment * subsidyRate * 10 * 12;
  return round(Math.min(support, MAX_GOV_SUPPORT), 2);
}
function calculateInvestmentIncome(
  firstDeposit: number,
  monthlyPayment: number,
  subsidyRate: number,
  interestRate: number,
): number {
  const annualPayment = monthlyPayment * 12;
  const adjustedPayment = Math.min(firstDeposit, monthlyPayment * subsidyRate * 12);
  return round(
    ((annualPayment + adjustedPayment) * (Math.pow(1 + interestRate, INVEST_DURATION) - 1)) / (interestRate * 2),
    2,
  );
}
function calculateTaxRefund(monthlyPayment: number, taxRate: number): number {
  return round(monthlyPayment * taxRate * INVEST_DURATION * 12, 2);
}

export const App = () => {
  const [loading, setLoading] = useState(false);
  const [openBs, setOpenBs] = useState(false);
  const [error, setError] = useState('');
  const [sum, setSum] = useState<string>('');
  const [thxShow, setThx] = useState(LS.getItem(LSKeys.ShowThx, false));
  const [calcData, setCalcData] = useState<{
    incomeValue: number;
    firstDeposit: number;
    monthlyDeposit: number;
    taxInvest: boolean;
  }>({
    firstDeposit: 72_000,
    incomeValue: 80_000,
    monthlyDeposit: 6_000,
    taxInvest: false,
  });

  const subsidyRate = calcData.incomeValue === 80_000 ? 1 : calcData.incomeValue === 150_000 ? 0.5 : 0.25;
  const deposit15years = calculateSumContributions(calcData.monthlyDeposit);
  const taxRefund = calculateTaxRefund(calcData.monthlyDeposit, TAX);
  const govCharity = calculateStateSupport(calcData.monthlyDeposit, subsidyRate);
  const investmentsIncome = calculateInvestmentIncome(
    calcData.firstDeposit,
    calcData.monthlyDeposit,
    subsidyRate,
    INTEREST_RATE,
  );
  const total = investmentsIncome + govCharity + (calcData.taxInvest ? taxRefund : 0) + deposit15years;

  useEffect(() => {
    if (!LS.getItem(LSKeys.UserId, null)) {
      LS.setItem(LSKeys.UserId, Date.now());
    }
  }, []);

  useEffect(() => {
    setCalcData(d => ({ ...d, monthlyDeposit: Number(sum) }));
  }, [sum]);

  const submit = () => {
    if (!sum) {
      setError('Введите сумму взноса');
      return;
    }

    setLoading(true);
    sendDataToGA({
      auto: 'None',
      sum: Number(sum),
      id: LS.getItem(LSKeys.UserId, 0) as number,
    }).then(() => {
      LS.setItem(LSKeys.ShowThx, true);
      setThx(true);
      setLoading(false);
    });
  };

  const handleChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (error) {
      setError('');
    }

    setSum(e.target.value);
  };
  const handleBlurInput = () => {
    const value = Number(sum);

    if (value < min) {
      setSum('2000');
      return;
    }
    if (value > max) {
      setSum('3000000');
      return;
    }
  };
  const handleBlurInputCalc1 = () => {
    const value = Number(sum);

    if (value < min) {
      setCalcData({ ...calcData, firstDeposit: min });
      return;
    }
  };

  const handleBlurInputCalc2 = () => {
    const value = Number(sum);

    if (value < min) {
      setCalcData({ ...calcData, monthlyDeposit: min });
      return;
    }
    if (value > max) {
      setCalcData({ ...calcData, monthlyDeposit: max });
      return;
    }
  };

  const openCalc = () => {
    window.gtag('event', 'calc_4597_var2');
    setOpenBs(true);
  };
  const closeCalc = () => {
    setOpenBs(false);
    sendDataToGACalc({
      id: LS.getItem(LSKeys.UserId, 0) as number,
      calc: `${calcData.incomeValue},${calcData.firstDeposit},${calcData.monthlyDeposit},${calcData.taxInvest ? 'T' : 'F'}`,
    });
  };

  if (thxShow) {
    return <ThxSpinner />;
  }

  return (
    <>
      <div className={appSt.container}>
        <Typography.TitleResponsive style={{ marginTop: '1rem' }} tag="h1" view="medium" font="system" weight="semibold">
          Сумма взноса
        </Typography.TitleResponsive>

        <div>
          <Typography.Text view="primary-small" color="secondary" tag="p" defaultMargins={false}>
            Счёт списания
          </Typography.Text>

          <div className={appSt.banner}>
            <img src={rubIcon} width={48} height={48} alt="rubIcon" />

            <Typography.Text view="primary-small" weight="medium">
              Текущий счёт
            </Typography.Text>
          </div>
        </div>

        <Input
          hint="От 2000 до 3 000 000 ₽"
          type="number"
          min={min}
          max={max}
          label="Сумма взноса"
          error={error}
          value={sum}
          onChange={handleChangeInput}
          onBlur={handleBlurInput}
          block
          pattern="[0-9]*"
        />

        <div>
          <Swiper spaceBetween={12} slidesPerView="auto">
            {chips.map(chip => (
              <SwiperSlide key={chip} className={appSt.swSlide}>
                <Tag view="filled" size="xxs" shape="rectangular" onClick={() => setSum(String(chip))}>
                  {chip.toLocaleString('ru')} ₽
                </Tag>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
      <Gap size={256} />

      <div className={appSt.bottomBtn}>
        <div className={appSt.btmRow} onClick={openCalc}>
          <div>
            <Typography.Text view="primary-small" color="secondary" tag="p" defaultMargins={false}>
              Примерный доход через 15 лет
            </Typography.Text>
            <Typography.Text view="primary-medium" weight="medium">
              {sum ? total.toLocaleString('ru') : 'X'} ₽
            </Typography.Text>
          </div>
          <ChevronRightMIcon color="#898991" />
        </div>
        <ButtonMobile loading={loading} block view="primary" onClick={submit}>
          Продолжить
        </ButtonMobile>
      </div>

      <BottomSheet
        title={
          <Typography.Title tag="h2" view="small" font="system" weight="semibold">
            Калькулятор дохода за 15 лет
          </Typography.Title>
        }
        open={openBs}
        onClose={closeCalc}
        titleAlign="left"
        stickyHeader
        hasCloser
        contentClassName={appSt.btmContent}
        actionButton={
          <ButtonMobile block view="primary" onClick={closeCalc}>
            Понятно
          </ButtonMobile>
        }
      >
        <div className={appSt.container}>
          <div>
            <Typography.Text view="primary-small" color="secondary" tag="p" defaultMargins={false}>
              Ежемесячный доход
            </Typography.Text>

            <Swiper spaceBetween={12} slidesPerView="auto" style={{ marginTop: '12px' }}>
              {chipsIncome.map(chip => (
                <SwiperSlide key={chip.value} className={appSt.swSlide}>
                  <Tag
                    view="filled"
                    size="xxs"
                    shape="rectangular"
                    checked={calcData.incomeValue === chip.value}
                    onClick={() => setCalcData({ ...calcData, incomeValue: chip.value })}
                  >
                    {chip.title}
                  </Tag>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          <Input
            hint="От 2000 ₽"
            type="number"
            label="Первоначальный взнос"
            labelView="outer"
            block
            placeholder="72 000 ₽"
            value={calcData.firstDeposit.toString()}
            onChange={e => setCalcData({ ...calcData, firstDeposit: Number(e.target.value) })}
            onBlur={handleBlurInputCalc1}
            pattern="[0-9]*"
          />
          <Input
            type="number"
            label="Взносы в месяц"
            labelView="outer"
            block
            placeholder="6000 ₽"
            value={calcData.monthlyDeposit.toString()}
            onChange={e => setCalcData({ ...calcData, monthlyDeposit: Number(e.target.value) })}
            onBlur={handleBlurInputCalc2}
            pattern="[0-9]*"
          />

          <Checkbox
            block={true}
            size={24}
            label="Инвестировать налоговый вычет в программу"
            checked={calcData.taxInvest}
            onChange={() => setCalcData({ ...calcData, taxInvest: !calcData.taxInvest })}
          />

          <div className={appSt.box}>
            <div style={{ marginBottom: '15px' }}>
              <Typography.TitleResponsive tag="h3" view="medium" font="system" weight="semibold">
                {total.toLocaleString('ru')} ₽
              </Typography.TitleResponsive>

              <Typography.Text view="primary-small" color="secondary">
                Накопите к 2040 году
              </Typography.Text>
            </div>

            <div className={appSt.btmRowCalc}>
              <Typography.Text view="secondary-large" color="secondary">
                Доход от инвестиций
              </Typography.Text>
              <Typography.Text view="primary-small">{investmentsIncome.toLocaleString('ru')} ₽</Typography.Text>
            </div>
            <div className={appSt.btmRowCalc}>
              <Typography.Text view="secondary-large" color="secondary">
                Государство добавит
              </Typography.Text>
              <Typography.Text view="primary-small">{govCharity.toLocaleString('ru')} ₽</Typography.Text>
            </div>
            {calcData.taxInvest && (
              <div className={appSt.btmRowCalc}>
                <Typography.Text view="secondary-large" color="secondary">
                  Налоговые вычеты добавят
                </Typography.Text>
                <Typography.Text view="primary-small">{taxRefund.toLocaleString('ru')} ₽</Typography.Text>
              </div>
            )}
            <div className={appSt.btmRowCalc}>
              <Typography.Text view="secondary-large" color="secondary">
                Взносы за 15 лет
              </Typography.Text>
              <Typography.Text view="primary-small">{deposit15years.toLocaleString('ru')} ₽</Typography.Text>
            </div>
          </div>
        </div>
      </BottomSheet>
    </>
  );
};
